var project = (function () {
	var publicFunctions = {
		
		alert: {
			/*
			*	Description: It takes either 1 or 2 params;
			*	1 param only: Its a text;
			*	2 params only: first param is title second param is text; 
			*	Null can be used in text to use title only or vise versa for text
			 */

			success: function () {
				privateFunctions.createConfigViaType(this,"success");
				this.config = privateFunctions.decorateOptions(arguments, this.config);
				
				return this.swal(this.config);
			},
			warning: function () {
				privateFunctions.createConfigViaType(this,"warning");
				this.config = privateFunctions.decorateOptions(arguments, this.config);
				
				return this.swal(this.config);
			},
			danger: function () {
				this.error.apply(null, arguments);
			},
			error: function () {
				privateFunctions.createConfigViaType(this,"error");
				this.config = privateFunctions.decorateOptions(arguments, this.config);
				
				return this.swal(this.config);
			},
			info: function () {
				privateFunctions.createConfigViaType(this,"info");
				this.config = privateFunctions.decorateOptions(arguments, this.config);

				return this.swal(this.config);
			},

			swal: function (options) {
				this.config = null;

				//if any modal is open, close it first
				var showingModals = $(".modal.in");
				showingModals.addClass("hidden");

				//set default options
				options.confirmButtonText = options.confirmButtonText || "Tamam";
				options.cancelButtonText = options.cancelButtonText || "Vazgeç";
	
				options.confirmButtonColor = options.confirmButtonColor || '#5cb85c';
				options.cancelButtonColor = options.cancelButtonColor || '#D91E18';

				options.allowEscapeKey = options.allowEscapeKey || false;
				options.allowOutsideClick = options.allowOutsideClick || false;
	
				if (options.showCancelButton)
				{
					options.confirmButtonText = '<i class="fa fa-check"></i> ' + options.confirmButtonText;
					options.cancelButtonText = '<i class="fa fa-times"></i> ' + options.cancelButtonText;
				}

				//show swal
				return swal(options).then(
					function(){
					//if any modal is closed to show swal, open it first
						showingModals.removeClass("hidden");
					}
				);
			},

			title: function (title){
				privateFunctions.createConfig(this);
				this.config.title = title;
				
				return this;
			},

			text: function (text){
				privateFunctions.createConfig(this);
				this.config.text = text;
				
				return this;
			},

			options: function (optionz){
				privateFunctions.createConfig(this);
				Object.assign(this.config, optionz);
				
				return this;
			}

		},
		helper: {
			put0: function (number) {
				return number < 10 ? "0" + number : number;
			},
			findWithAttr: function (array, attr, value) {
				for (var i = 0; i < array.length; i += 1) {
					if (array[i][attr] === value) {
						return i;
					}
				}
				return -1;
			},
			getParameters:function (name){
				var params = {};
				
				if (window.location.search.indexOf("?")>-1){
					var l = window.location.search.split("?")[1].split("&");
					
					for (var i=0; i<l.length; i++){
						var n = l[i].split("=");
						params[n[0]] = n[1];	
					}
				}

				if (name) 
				{
					return params[name];
				}
				return params;
			},

			bytesToSize: function (bytes) {
				var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
				if (bytes == 0) {return 'n/a';}
				var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
				if (i == 0) {return { val: bytes, sizeType: sizes[i] };}
				return {
					val: (bytes / Math.pow(1024, i)).toFixed(1),
					sizeType: sizes[i]
				};
			},

			turkishToLower: function (string) {        
				var letters = { "İ": "i", "I": "ı", "Ş": "ş", "Ğ": "ğ", "Ü": "ü", "Ö": "ö", "Ç": "ç" };
				string = string.replace(/(([İIŞĞÜÇÖ]))/g, function (letter) { return letters[letter]; });
				return string.toLowerCase();
			}
		}
	};


	var privateFunctions = {
		createConfig : function (that){
			that.config = that.config || {};
		},
		createConfigViaType:function(that, type){
			this.createConfig(that);
			that.config.type = type;		
		},
		decorateOptions: function (argz, optionz) {
			var text;
			
			if (argz.length === 1) {
				text = argz[0];
				optionz.text = text;
			} else if (argz.length === 2) {
				var title = argz[0];
				text = argz[1];
				if (text !== null) {
					optionz.text = text;
				}
				if (title !== null) {
					optionz.title = title;
				}
			}
			return optionz;
		}
	};
	
	return publicFunctions;
})();

String.prototype.turkishUpperCase = function () {
	return this.replace(/ğ/g, 'Ğ')
		.replace(/ü/g, 'Ü')
		.replace(/ş/g, 'Ş')
		.replace(/ı/g, 'I')
		.replace(/i/g, 'İ')
		.replace(/ö/g, 'Ö')
		.replace(/ç/g, 'Ç')
		.toUpperCase();
};//String.turkishUpperCase

String.prototype.turkishLowerCase = function () {
	return this.replace(/Ğ/g, 'ğ')
		.replace(/Ü/g, 'ü')
		.replace(/Ş/g, 'ş')
		.replace(/I/g, 'ı')
		.replace(/İ/g, 'i')
		.replace(/Ö/g, 'ö')
		.replace(/Ç/g, 'ç')
		.toLowerCase();
};//String.turkishLowerCase

String.prototype.turkishCapitalize = function () {
	return this.charAt(0).turkishUpperCase() + this.slice(1).turkishLowerCase();
};//String.turkishCapitalize

String.prototype.turkishCapitalizeWords = function () {
	var a = this.split(' ');
	for (var i = 0; i < a.length; i++) {a[i] = a[i].turkishCapitalize();}
	return a.join(' ');
};//String.turkishCapitalizeWords

jQuery.expr[":"].Contains = jQuery.expr.createPseudo(function (arg) {
    arg = arg.replace(/i/g, "İ");
    return function (elem) {
        return jQuery(elem).text().replace(/i/g, "İ").toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});

$.extend($.expr[":"], {
    "starts-with": function (elem, i, data, set) {
        var text = $.trim($(elem).text()),
            term = data[3];

        // first index is 0
        return text.indexOf(term) === 0;
    },

    "ends-with": function (elem, i, data, set) {
        var text = $.trim($(elem).text()),
            term = data[3];

        // last index is last possible
        return text.lastIndexOf(term) === text.length - term.length;
    }
});

$.extend($.expr[":"], {
    "containsIN": function (elem, i, match, array) {
        return project.helper.turkishToLower(elem.textContent || elem.innerText || "").indexOf(project.helper.turkishToLower(match[3] || "")) >= 0;
    }
});
