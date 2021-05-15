import bootstrapSelectTemplate from "../../views/plugins/bootstrapselectv2.template.html"

(function () {
    'use strict';

	angular
        .module('productList')
        .directive('bootstrapselect', bootstrapselect);

    bootstrapselect.$inject = ["$rootScope"];

    function bootstrapselect($rootScope) {
        var directive = {
            link: link,
            require: 'ngModel',
            restrict: 'EA',
            scope: {
                optionViewLimit: "@optionViewLimit",
                optionSelectedValue: "=optionSelectedValue",
                optionPreventInitialOnChange:"=optionPreventInitialOnChange",
                optionMultiSelect: "=optionMultiSelect",             
				optionSearch:"=optionSearch",
				optionDynamicCreation: "=optionDynamicCreation",
                sourceData:"=sourceData",
                valueProperty: "@valueProperty", //$self
                titleProperty: "@titleProperty",
                configDefaultLabel: "@configDefaultLabel",
                configWidth:"@configWidth",
                ngModel: "=ngModel",
                onChange: "=onChange",
                debug:"=debug"
            },
            template: bootstrapSelectTemplate
        };

        function link(scope, element, attrs,ngModelCtrl) {
            
            
            var DEFAULT_VIEW_LIMIT = scope.optionViewLimit ? scope.optionViewLimit * 3 : 30;
            var presentationDataHolder = [];
            var isInitalized = false;
            var localize = {
                LOADING:"Yükleniyor"
            };
            var arrowTravelingActive = false;
            var keyCodeTravelingSearchWord = "";
            var keyCodeTravelingTimeOut = null;
            var selectAllFlag = false;
            scope.selectLabel = scope.configDefaultLabel;
            scope.recordViewInitialLimit = DEFAULT_VIEW_LIMIT;
            scope.context = {
                searchText: ""
            };


            scope.multiSelectedItemList = multiSelectedItemList;
            scope.exportSelectedsToNgmodel = exportSelectedsToNgmodel;
            scope.applySearchKeyFilter = applySearchKeyFilter;
            scope.select = select;
            scope.resetArrowTraveling = resetArrowTraveling;
            scope.isDirty = false;
            


            initialize();

           

        

            function initialize() {
               
                    ngModelCtrl.$modelValue = undefined;
                    scope.ngModel = undefined;
                    selectAllFlag = false;
                    arrowTravelingActive = false;
                    keyCodeTravelingSearchWord = "";
                    scope.presentationData = [];
                    presentationDataHolder = [];
                    scope.selectedItem = null;
                    createPresentationData();

                    if (scope.optionSelectedValue !== undefined) {
                        findAndSelectDefaultValue();
                    }

                    setTimeout(function () {
                        scope.selectLabel = scope.configDefaultLabel;
                        scope.$apply();
                    }, 150);
                    
                    
                    if (!isInitalized) {
                        bindScrollEvents();
                        bindKeypressEvents();
                        bindScopeEvents();
                        bindSeleniumEvents();
                    }

                    isInitalized = true;
            }


            function bindSeleniumEvents() {

              
                document.addEventListener("select-option", function (evt) {
                    var targetOptionIndex = evt.detail.target_option - 1;
                    if (evt.detail.dropdown_id.indexOf(attrs.id) > -1) {                                                
                        element.find(".bootstrap-select-presentation-data:eq(" + targetOptionIndex + ")").find("a").click();
                    }
                });

                document.addEventListener("get-value", function (evt) {
                    if (evt.detail.dropdown_id.indexOf(attrs.id) > -1) {

                        var event = new CustomEvent('get-value-response', { detail: { 'dropdown_selected_value': ngModelCtrl.$modelValue } });
                        document.dispatchEvent(event);
                    }

                });

                document.addEventListener("get-disabled-values", function (evt) {
                    if (evt.detail.dropdown_id.indexOf(attrs.id) > -1) {

                        var disableds = scope.presentationData.filter(function (item) {
                            return item.disabled;
                        });




                        var event = new CustomEvent('get-disabled-values-response', { detail: { 'dropdown_disabled_values': disableds } });


                        document.dispatchEvent(event);
                    }

                });


               

            }

            function bindScopeEvents() {


                scope.$watch('sourceData', function (n, o) {
                    scope.selectLabel = localize.LOADING;
                    initialize();
                });

                scope.$watch("ngModel", function (n, o) {
                    if (n) {
                       
                        $rootScope.$broadcast("selectbox::" + element.attr("id") + "::onselect", n);

                    }
                });

            }


            function findAndSelectDefaultValue() {
               
                var isDefaultValueObject = typeof scope.optionSelectedValue === "object";

                var targetItem = scope.presentationData.filter(function (item) {

                    if (isDefaultValueObject) {
                        return angular.equals(item.value, scope.optionSelectedValue);
                    }
                    else {
                        return item.value === scope.optionSelectedValue;
                    }
                   
                })[0];

                if (targetItem) {                    
                    var preventOnChange = scope.optionPreventInitialOnChange ? true : false;
                    select(targetItem,false,preventOnChange);
                }
            }


            function applySearchKeyFilter(keyword) {

              
                
                if(keyword.length > 0){
                    var filteredData = presentationDataHolder.filter(function (item) {
                        var keywords = keyword.split(" ");
                        var founded = true;
                        for (var i in keywords) {
                            if (!(project.helper.turkishToLower(item.title).indexOf(project.helper.turkishToLower(keywords[i])) > -1)) {
                                founded = false;
                            }
                        }
                        return founded;
					});
					
					var hasExactOneItem = filteredData.length == 1 && keyword.length === filteredData[0].title.length; 
					if (scope.optionDynamicCreation && !hasExactOneItem)
					{
						filteredData.unshift({title:keyword, value: keyword, disabled:false});
					}

                    scope.presentationData = filteredData;
                }
                else {
                    scope.recordViewInitialLimit = DEFAULT_VIEW_LIMIT;
                    scope.presentationData = presentationDataHolder;
                }
            }


            function ScrollEventHandler_stickySearchText($event) {
                var scrollTop = $event.target.scrollTop;
                if (scrollTop >= 40) {
                    $(element).find("#search-text").css({ 'margin-top': scrollTop + "px" });
                }
                else {
                    $(element).find("#search-text").css({ 'margin-top': "0px" });
                }
            }

            function ScrollEventHandler_recordViewLimitUpdater($event) {
                var target = $event.target;
                if (target.scrollHeight - target.scrollTop === target.clientHeight && scope.recordViewInitialLimit < scope.presentationData.length) {
                 
                    scope.recordViewInitialLimit += scope.optionViewLimit*1;
                    setTimeout(function () {
                        scope.$apply();
                    });
                }
                

            }

            function bindScrollEvents() {

             
                var listScroll = element.find(".dropdown-menu");
                listScroll.scroll(function ($event) {                 
                    ScrollEventHandler_stickySearchText($event);
                    ScrollEventHandler_recordViewLimitUpdater($event);
                });
               



            }

            function resetArrowTraveling() {
                arrowTravelingActive = false;
            }

            function KeypressEventHandler_ArrowTraveling(key) {              
                if (arrowTravelingActive === false) {
                    var targetItemIndex = Math.ceil(element.find(".dropdown-menu").get(0).scrollTop / 34);
                    if(scope.optionSearch){
                        targetItemIndex += 2;
                    }
                    arrowTravelingActive = true;
                    element.find("#search-text").blur();
                    element.find(".dropdown-menu").find("li:eq(" + targetItemIndex + ")").find("a").focus();
                }    
            }

            function KeypressEventHandler_LetterTraveling(keyCode) {

                if (keyCodeTravelingTimeOut !== null) {
                    clearTimeout(keyCodeTravelingTimeOut);
                }

                var currentLetter = String.fromCharCode(event.keyCode);
                currentLetter = currentLetter.replace(/Þ/g, 'İ');
                currentLetter = currentLetter.replace(/¿/g, 'Ö');
                currentLetter = currentLetter.replace(/Û/g, "Ğ");
                currentLetter = currentLetter.replace(/Ü/g, "Ç");
                currentLetter = currentLetter.replace(/Ý/g, "Ü");
                currentLetter = currentLetter.replace(/º/g, "Ş");
                keyCodeTravelingSearchWord += project.helper.turkishToLower(currentLetter);

                var items = element.find(".dropdown-menu li").get();

                for (var a in items) {
                    var item = $(items[a]).find("a").get(0);
                    if (project.helper.turkishToLower(item.innerHTML).indexOf(keyCodeTravelingSearchWord) > -1) {                       
                        item.focus();
                        break;
                    }
                    
                }

                
                keyCodeTravelingTimeOut = setTimeout(function () {
                    keyCodeTravelingSearchWord = "";
                }, 2000);
                


            }

            function isKeyAlphaNumeric(keycode) {
                return (
                        keycode == 36 ||
                        keycode == 32 ||
                        keycode == 13 ||
                        keycode > 64 && keycode < 91 ||
                        keycode >= 37 && keycode <= 40 ||
                        keycode == 8 ||
                        keycode == 46 ||
                        keycode == 73 ||
                        keycode == 219 ||
                        keycode == 221 ||
                        keycode == 191 ||
                        keycode == 220 ||
                        keycode == 186 ||
                        keycode == 222 ||
                        keycode == 35 ||
                        keycode == 9
                    );
            }
            function bindKeypressEvents() {

                var ArrowTravelingKeys = ["ArrowUp", "ArrowDown"];

                element.find(".dropdown-menu").keyup(function ($event) {

                  
                 
                    if (ArrowTravelingKeys.indexOf($event.key)>-1) {
                        KeypressEventHandler_ArrowTraveling($event.key);
                    }
                    
                    if (isKeyAlphaNumeric($event.keyCode) && !scope.optionSearch) {                      
                        KeypressEventHandler_LetterTraveling($event.keyCode);
                    }

					if (scope.optionDynamicCreation && $event.key === "Enter")
					{
						select(scope.presentationData[0], $event);
					}

                });

                element.find(".dropdown-toggle").keyup(function ($event) {
                    if (isKeyAlphaNumeric($event.keyCode) && !scope.optionSearch) {
                        KeypressEventHandler_LetterTraveling($event.keyCode);
                    }
                });
            }

            function selectAll() {
                selectAllFlag = !selectAllFlag;
                scope.presentationData.forEach(function (item) {
                    
                    if(!item.reserved){
                        //select(item, false, false, selectAllFlag);
                        item.selected = selectAllFlag;
                    }
                });

                var selectedItems = exportSelectedsToNgmodel();

                if (scope.onChange && typeof scope.onChange === "function" ) {
                    setTimeout(function () {
                        scope.$apply();
                        scope.onChange(selectedItems);
                    }, 1);
                }
            }

            function createPresentationData() {

                if(scope.sourceData){
                    var copiedSourceData = angular.copy(scope.sourceData);
                    var presentationData = copiedSourceData.map(function (item, index) {

                        var presentationValue = scope.valueProperty !== "$self"?getTargetPropFromObject(scope.valueProperty,copiedSourceData,index):item;
                        var presentationTitle = getTargetPropFromObject(scope.titleProperty, copiedSourceData, index);

                        return {
                            "title": presentationTitle,
                            "value": presentationValue,
                            "disabled":item.disabled !== undefined?item.disabled:false
                          
                        };

                    });

                    if (scope.optionMultiSelect && presentationData.length > 0) {
                        presentationData.unshift({
                            title: "TÜMÜNÜ SEÇ",
                            value: "#",
                            _class: "bold", 
                            reserved: true,
                            ___function: selectAll
                           
                        });
                    }
                   

                    scope.presentationData = presentationData;
                    if(scope.optionSearch){
                        presentationDataHolder = presentationDataHolder.concat(scope.presentationData);
                    }
                }

            }

            function getTargetPropFromObject(propertyMapping, targetArray, index) {
                
                var targetObject = targetArray[index];
                var propMap = propertyMapping.split(".");
                var assignedObject = null;
                
                for (var a in propMap) {
                    var currentProp = propMap[a];
                    assignedObject = assignedObject === null ? targetObject[currentProp] : assignedObject[currentProp];
                }

                return assignedObject;

            }

            function exportSelectedsToNgmodel() {
                var selectedItems = multiSelectedItemList().map(function (item) {
                    return item.value;
                });

                ngModelCtrl.$modelValue = selectedItems;
                scope.ngModel = selectedItems;

                return selectedItems;
            }

            function select(item, $event, preventOnChange,forceBoolean) {

                scope.isDirty = true;

                if (scope.optionSearch && !scope.optionMultiSelect) {
                    scope.context.searchText = "";
                    applySearchKeyFilter(scope.context.searchText);
                }
               
                if (scope.optionMultiSelect) {
                   
                    item.selected =forceBoolean !== undefined? forceBoolean : !item.selected;

                    if($event){
                        if ($event.stopPropagation) {$event.stopPropagation();}
                        if ($event.preventDefault) {$event.preventDefault();}
                        $event.cancelBubble = true;
                        $event.returnValue = false;

                        
                    }

                    if (item.reserved) {
                        if (item.___function && typeof item.___function === "function") {
                            item.___function();
                        }
                        return;
                    }

                    var selectedItems = exportSelectedsToNgmodel();
                    
                    if (scope.onChange && typeof scope.onChange === "function" && !preventOnChange) {
                        setTimeout(function () {
                            scope.$apply();
                            scope.onChange(selectedItems);
                        }, 1);                        
                    }

                }
                else {
                    ngModelCtrl.$modelValue = item.value;
                    scope.ngModel = item.value;
                    scope.selectedItem = item;
                    if (scope.onChange && typeof scope.onChange === "function" && !preventOnChange) {
                        setTimeout(function () {
                            scope.$apply();
                            scope.onChange(item.value);
                        }, 1);
                        
					}
					if (scope.optionDynamicCreation)
					{
						setTimeout(function(){scope.$apply();},50);
						$(".dropdown", element).removeClass("open");
					}
                    

                  
                }
                

            }

            function multiSelectedItemList() {
                var filteredItems = scope.presentationData.filter(function (item) {
                    return item.selected && !item.reserved;
                });
                return filteredItems;

            }




        }

        return directive;
    }
})();

