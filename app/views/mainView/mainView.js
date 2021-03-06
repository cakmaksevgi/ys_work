import menuListData from '../../data/menulist.json'
import mainTemplate from "./mainView.html"

import addProductModalTemplate from "../subViews/menuDemandAddProductModal.html"
import menuDemandListTemplate from "../subViews/menuDemandMyDemandsList.html"
import menuDemandViewTemplate from "../subViews/menuDemandViewComponent.html"

'use strict';
angular.module('productList', ['ngRoute'])

	.config(['$routeProvider', function ($routeProvider)
	{
		$routeProvider.when('/',
		{
			template: mainTemplate,
			controller: 'MenuDemandFormController'
		});
	}])
	.controller('MenuDemandFormController', MenuDemandFormController)
	.service('MenuDemandFormService', ["$q", function ($q)
	{
		var obj = {
			getProducts: function ()
			{
				return menuListData;
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

	}])
	.component('menuDemandViewTemplate', 
	{ 
		template: menuDemandViewTemplate,
		controller: MenuDemandFormController,
		controllerAs: "DemandForm_VM"
	})
	.component('menuDemandListTemplate', {template: menuDemandListTemplate, controller: MenuDemandFormController, controllerAs: "DemandForm_VM",})
	.component('addProductModalTemplate', {template: addProductModalTemplate, controller: MenuDemandFormController, controllerAs: "DemandForm_VM",});

	MenuDemandFormController.$inject = [
		'MenuDemandFormService'];
	function MenuDemandFormController(MenuDemandFormService)
	{
		var vm = this;

		vm.addNewProduct = addNewProduct;
		vm.editDraftProduct = editDraftProduct;
		vm.saveDraftProduct = saveDraftProduct;
		vm.deleteDraftProduct = deleteDraftProduct;

		vm.demandRequestBlur = demandRequestBlur;
		vm.demandRequestObjects = {};

		vm.submitForm = submitForm;
		vm.filterProducts = filterProducts;
		vm.clearFilter = clearFilter;

		vm.isDemandExist = false;
		vm.showDemandSummary = false;
		vm.productSearchText = '';

		var Product = {
			priceValidationErrMsg: "Fiyat 1TL - 999,99TL aras??nda olmal??d??r. K??s??rat 2 haneden fazla olamaz.",

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

			},

			priceInputValidationCheck: function(product, isNew) {
				const regexRule = /^\d{1,3}([,.]\d{1,2})*$/;
				const property = isNew ? "price" : "newprice";
				product.valid = !!product[property].match(regexRule) && parseInt(product[property]) > 0;
			},

			onNewProductNameChange: function() {
				vm.newProduct.valid = !!vm.newProduct.name
			}
		};

		vm.Product = Product;

		function addNewProduct (categoryId)
		{
			vm.newProduct = { isNewProduct: true, id: Product.getNextProductId(categoryId), name: "", price: "", description: "", categoryId: categoryId, valid: false };
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
				project.alert.warning("Eklemek istedi??iniz " + productName + " ??r??n?? men??n??zde yer almaktad??r");
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
				project.alert.warning("??r??n fiyat?? 0'dan b??y??k olmal??d??r.");
				return;
			}

			vm.Product.priceInputValidationCheck(productObject)

			if (!newprice || newprice === '0' || !productObject.valid)
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
					project.alert.info("De??i??iklikler kaydedildi.");
				})
				.catch(function () {

				});

		}

		function filterProducts() {
			const searchText = vm.productSearchText.toLowerCase();
			vm.categories.forEach(cat => {
				if(!!searchText) {
					let notMatchedProducts = cat.Products.filter(p => p.Name.toLowerCase().indexOf(searchText) < 0);
					if(notMatchedProducts.length == cat.Products.length) {
						cat.Shown = false;
						notMatchedProducts.forEach(prod => {
							prod.Shown = true;
						})
					} else {
						if(notMatchedProducts.length == 0) {
							cat.Shown = false;
						} else {
							cat.Shown = true;
							notMatchedProducts.forEach(prod => {
								prod.Shown = false;
							})
						}
					}
				} else {
					cat.Shown = true;
					cat.Products.forEach(prod => {
						prod.Shown = true;
					})
				}
			});
		}

		function clearFilter() {
			vm.productSearchText = '';
			vm.filterProducts();
		}

		let products = MenuDemandFormService.getProducts().Result;
		products = MenuDemandFormService.updateProductsWithEditedOnes(products, vm.demandRequestObjects);
		updateDemandLists();
		vm.categories = products;
	}
