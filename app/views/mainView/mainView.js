'use strict';
angular.module('productList', ['ngRoute'])

	.config(['$routeProvider', function ($routeProvider)
	{
		$routeProvider.when('/',
		{
			templateUrl: 'views/mainView/mainView.html',
			controller: 'MenuDemandFormController'
		});
	}])
	.controller('MenuDemandFormController', ["MenuDemandFormService", function (MenuDemandFormService)
	{
		var vm = this;

		vm.addNewProduct = addNewProduct;
		vm.editDraftProduct = editDraftProduct;
		vm.saveDraftProduct = saveDraftProduct;
		vm.deleteDraftProduct = deleteDraftProduct;

		vm.demandRequestBlur = demandRequestBlur;
		vm.demandRequestObjects = {};

		vm.submitForm = submitForm;

		vm.isDemandExist = false;
		vm.showDemandSummary = false;

		var Product = {
			getProductIndexAtCategory: function (category, productId)
			{
				var index = -1;
				for (var k = 0; k < category.Products.length; k++)
				{
					if (category.Products[k].ProductId === productId)
					{
						index = k;
						break;
					}
				}

				return index;
			},

			getCategoryById: function (categoryId)
			{
				for (var i = 0; i < vm.categories.length; i++)
				{
					if (vm.categories[i].Id === categoryId)
					{
						return vm.categories[i];
					}
				}
				return null;
			},

			getCategoryIdByProductId: function (productId)
			{
				if (productId.indexOf("_")>-1)
				{
					return productId.split("_")[0];
				}

				for (var i = 0; i < vm.categories.length; i++)
				{
					if (_.find(vm.categories[i].Products, function(p){return p.ProductId === productId;}))
					{
						return vm.categories[i].Id;
					}
				}
				return null;
			},

			getNextProductId: function (categoryId)
			{
				return categoryId + "_" + new Date().getTime();
			},

			convertFEProductObjectToService: function (product)
			{
				var categoryId = Product.getCategoryIdByProductId(product.id);
				var category = Product.getCategoryById(categoryId);
				var categoryName = category.Name;
				var productObject = {
					categoryName: categoryName,
					categoryId: categoryId,
					Description: product.description,
					Name: product.name,
					Price: product.price,
					newprice: product.price,
					ProductId: product.id,
					Status: 1,
					isNewProduct: product.isNewProduct
				};
				return productObject;
			},

			convertBEProductFromServiceToFEObject: function (productObject)
			{
				var categoryId = productObject.categoryId;
				var category = Product.getCategoryById(categoryId);
				var categoryName = category.Name;
				var product = {
					categoryName: categoryName,
					categoryId: categoryId,
					description: productObject.Description,
					name: productObject.Name,
					price: productObject.Price,
					id: productObject.ProductId,
					isNewProduct: productObject.isNewProduct
				};
				return product;
			},

			isPriceEqualToZero: function (price)
			{
				return price && Number(price.replace(",", ".")) === 0;
			},

			moveToProduct: function (product, moveToCategory)
			{
				vm.showFileExplorer = false;
				vm.showDemandSummary = false;

				if ($("._" + product.categoryId).hasClass("collapsed"))
				{
					$("._" + product.categoryId).click();
				}

				setTimeout(function ()
				{
					var target = moveToCategory ? $("._" + product.categoryId) : $("#" + product.ProductId);
					$('html, body').animate(
					{
						scrollTop: target.offset().top - 100
					}, 50);
					$("#" + product.ProductId).pulsate({ repeat: 3, color: '#26C281' });
				}, 200);

			}
		};

		vm.Product = Product;

		function addNewProduct (categoryId)
		{
			vm.newProduct = { isNewProduct: true, id: Product.getNextProductId(categoryId), name: "", price: "", description: "", categoryId: categoryId };
			vm.categoryIdToSelect = categoryId;

			vm.editingDraft = false;
			$('#addProductPopup').modal({ backdrop: 'static', keyboard: false });
		}

		function editDraftProduct (productObject)
		{

			vm.newProduct = Product.convertBEProductFromServiceToFEObject(vm.demandRequestObjects[productObject.ProductId]);
			vm.categoryIdToSelect = vm.newProduct.categoryId;

			vm.editingDraft = true;
			$('#addProductPopup').modal({ backdrop: 'static', keyboard: false });
		}

		function saveDraftProduct ()
		{
			var index;
			var category;
			var product = vm.newProduct;

			var hasProductWithSameName = false;
			var productName = vm.newProduct.name;

			vm.categories.forEach(function (category)
			{
				category.Products.forEach(function (product)
				{
					if (project.helper.turkishToLower(product.Name) === project.helper.turkishToLower(
						productName) && product.ProductId !== vm.newProduct.id)
					{
						hasProductWithSameName = true;
					}
				});
			});

			if (hasProductWithSameName)
			{
				project.alert.warning("Eklemek istediğiniz " + productName + " ürünü menünüzde yer almaktadır");
				return;
			}

			var categoryIdChanged = product.isNewProduct && !product.id.startsWith(product.categoryId);
			if (categoryIdChanged)
			{
				delete vm.demandRequestObjects[product.id];

				var categoryId = Product.getCategoryIdByProductId(product.id);
				var oldCategory = Product.getCategoryById(categoryId);

				if (oldCategory)
				{
					index = Product.getProductIndexAtCategory(oldCategory, product.id);

					if (index > -1)
					{
						oldCategory.Products.splice(index, 1);
					}
				}

				//var prevProductId = product.id;
				product.id = Product.getNextProductId(product.categoryId);

				product.isNewProduct = true;
			}

			var productObject = Product.convertFEProductObjectToService(product);

			category = Product.getCategoryById(product.categoryId);

			index = Product.getProductIndexAtCategory(category, productObject.ProductId);

			if (index === -1)
			{
				index = category.Products.length;
			}

			category.Products[index] = productObject;

			vm.demandRequestObjects[productObject.ProductId] = productObject;

			updateDemandLists();
			$('#addProductPopup').modal("hide");

			vm.categoryIdToSelect = null;
			vm.productNamesToSelect = null;

			if (!vm.editingDraft || categoryIdChanged)
			{
				Product.moveToProduct(productObject, true);
			}
		}

		function deleteDraftProduct ()
		{
			var product = vm.newProduct;

			var categoryId = Product.getCategoryIdByProductId(product.id);
			var category = Product.getCategoryById(categoryId);
			var index = Product.getProductIndexAtCategory(category, product.id);

			category.Products.splice(index, 1);
			delete vm.demandRequestObjects[product.id];

			updateDemandLists();
			$('#addProductPopup').modal("hide");
		}

		function updateDemandLists ()
		{

			if (Object.keys(vm.demandRequestObjects).length > 0)
			{
				vm.isDemandExist = true;
			}
			else
			{
				vm.isDemandExist = false;
				vm.showDemandSummary = false;
			}

			vm.demandCount = Object.keys(vm.demandRequestObjects).length;
		}

		function demandRequestBlur (event, productObject)
		{
			productObject.categoryId = Product.getCategoryIdByProductId(productObject.ProductId);
			var newprice = productObject.newprice;
			var isPriceOk = !Product.isPriceEqualToZero(newprice);

			if (!isPriceOk)
			{
				project.alert.warning("Ürün fiyatı 0'dan büyük olmalıdır.");
				return;
			}

			if (!newprice || newprice === '0')
			{
				var productOnRequestObjects = vm.demandRequestObjects[productObject.ProductId];

				if (productOnRequestObjects)
				{
					delete vm.demandRequestObjects[productObject.ProductId];
				}
			}
			else
			{
				vm.demandRequestObjects[productObject.ProductId] = productObject;
			}

			updateDemandLists();
		}

		function collectDemandProducts ()
		{
			var productList = [];

			for (var key in vm.demandRequestObjects)
			{
				var product = vm.demandRequestObjects[key];
				productList.push(product);
			}
			return productList;
		}

		
		function submitForm ()
		{
			var products = collectDemandProducts();

			MenuDemandFormService.saveProducts(products)
				.then(function () {
					project.alert.info("Değişiklikler kaydedildi.");
				})
				.catch(function () {

				});

		}

		MenuDemandFormService.getProducts().then(
			function (response)
			{
				var products = response.data.Result;
				products = MenuDemandFormService.updateProductsWithEditedOnes(products, vm.demandRequestObjects);
				updateDemandLists();
				vm.categories = products;
			},
			function () {

			}
		);

	}])
	.service('MenuDemandFormService', ["$q", "$http", function ($q, $http)
	{
		var obj = {
			getProducts: function ()
			{
				return $http.get("data/menulist.json");
			},
			updateProductsWithEditedOnes: function (products, demandRequestObjects)
			{
				var alreadyEditedProducts = localStorage.getItem("products");
				if (alreadyEditedProducts)
				{
					try
					{
						alreadyEditedProducts = JSON.parse(alreadyEditedProducts);
					}
					catch (err)
					{
						alreadyEditedProducts = null;
					}

					if (alreadyEditedProducts)
					{
						alreadyEditedProducts.forEach(function (product)
						{

							var category = _.find(products, function (c) { return c.Id === product.categoryId; });
							if (!category)
							{
								return;
							}
							var productAtCategory = _.find(category.Products, function (p) { return p.ProductId === product.ProductId; });

							if (productAtCategory)
							{
								Object.assign(productAtCategory, product);
								demandRequestObjects[product.ProductId] = productAtCategory;
							}
							else
							{
								category.Products.push(product);
								demandRequestObjects[product.ProductId] = product;
							}

						});

					}
				}

				return products;
			},
			saveProducts: function (products)
			{
				var deferred = $q.defer();
				localStorage.setItem("products", JSON.stringify(products));
				setTimeout(
					function ()
					{
						deferred.resolve(true);
					}, 500
				);

				return deferred.promise;

			}
		};
		return obj;

	}]);
