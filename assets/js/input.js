
var acf_medium_editors = {};
var acf_medium_editor_timeout = false;

(function($){
	/**
	 * Custom `color picker` extension
	 */
	var ColorPickerExtension = MediumEditor.extensions.button.extend({
	    name: "colorPicker",
	    action: "applyForeColor",
	    aria: "color picker",
	    contentDefault: "<span class='editor-color-picker'>Text Color<span>",

	    init: function() {
		this.button = this.document.createElement('button');
		this.button.classList.add('medium-editor-action');
		this.button.innerHTML = '<b>Bla bla</b>';

		initPicker(this.button);
	    }
	});

	var pickerExtension = new ColorPickerExtension();


	function setColor(color) {
	    pickerExtension.base.importSelection(this.selectionState);
	    pickerExtension.document.execCommand("styleWithCSS", false, true);
	    pickerExtension.document.execCommand("foreColor", false, color);
	}

	function initPicker(element) {
	    $(element).spectrum({
		allowEmpty: true,
		color: "#f00",
		showInput: true,
		showAlpha: true,
		showPalette: true,
		showInitial: true,
		hideAfterPaletteSelect: false,
		preferredFormat: "hex3",
		change: function(color) {
		    setColor(color);
		},
		hide: function(color) {
		    //applyColor(color);
		},
		palette: [
		    ["#000", "#444", "#666", "#999", "#ccc", "#eee", "#f3f3f3", "#fff"],
		    ["#f00", "#f90", "#ff0", "#0f0", "#0ff", "#00f", "#90f", "#f0f"],
		    ["#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3", "#d9d2e9", "#ead1dc"],
		    ["#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#9fc5e8", "#b4a7d6", "#d5a6bd"],
		    ["#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6fa8dc", "#8e7cc3", "#c27ba0"],
		    ["#c00", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3d85c6", "#674ea7", "#a64d79"],
		    ["#900", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#0b5394", "#351c75", "#741b47"],
		    ["#600", "#783f04", "#7f6000", "#274e13", "#0c343d", "#073763", "#20124d", "#4c1130"]
		]
	    });
	}
	
	function acf_get_medium_editor_selector($el, $selector) {
		// because of repeaters, flex fields and clones
		// selector needs to be absolutely specific
		if ($selector != '') {
			$selector = '>'+$selector.trim();
		}
			
		var $parent = $el.parent();
		if ($parent.hasClass('acf-clone')) {
			// do not add editors to any clones
			// wait until they are active
			return false;
		}
		if ($parent.hasClass('acf-postbox')) {
			$selector = $parent.prop('nodeName').toLowerCase()+'#'+$parent.attr('id')+$selector;
			return $selector;
		}
		if ($parent.prop('nodeName').toLowerCase() == 'form') {
			$selector = $parent.prop('nodeName').toLowerCase()+$selector;
			return $selector;
		}
		if (typeof($parent.data('key')) != 'undefined') {
			$selector = '[data-key="'+$parent.data('key')+'"]'+$selector;
		}
		if (typeof($parent.data('id')) != 'undefined') {
			$selector = '[data-id="'+$parent.data('id')+'"]'+$selector;
		}
		if ($parent.hasClass('acf-row')) {
			$selector = '.acf-row'+$selector;
		}
		if (typeof($parent.attr('id')) != 'undefined') {
			$selector = '#'+$parent.attr('id')+$selector;
		}
		$selector = $parent.prop('nodeName').toLowerCase()+$selector;
		
		// recurse
		$selector = acf_get_medium_editor_selector($parent, $selector);
		
		return $selector;
	}
	
	function initialize_acf_medium_editor_field($el) {
		var $textarea = $el.find('textarea').first();
		var $selector = 'textarea'
		$selector = acf_get_medium_editor_selector($textarea, $selector);
		if (!$selector) {
			return;
		}
		
		var $key = $el.data('key');
		var $uniqid = acf.get_uniqid();
		var $data = $el.find('div[data-key="medium_editor_'+$key+'"]').first();
		
		var $delay = $data.data('delay');
		if ($delay == 1 && !$textarea.hasClass('focused')) {
			// dealy init
			$el.find('.acf-label label').append('<span class="medium-editor-delay-init">Click to Initialize MediumEditor</span>');
			$textarea.focus(function(e) {
				$textarea.addClass('focused');
				$el = $(e.target).closest('.acf-field');
				$el.find('.acf-label label span.medium-editor-delay-init').remove();
				initialize_acf_medium_editor_field($el);
			});
			return;
		}
		
		var $container;
		var $static = false;
		var $align = 'left';
		
		if (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1)  {
			$static = true;
			$container = null;
		} else {
			$data.closest('.acf-input').prepend('<div id="medium-editor-container-'+$uniqid+'"></div>');
			$container = document.getElementById('medium-editor-container-'+$uniqid);
		}
		
		$static = false;
		$container = null;
		
		var $buttons = decodeURIComponent($data.data('buttons'));
		var $buttons = JSON.parse(decodeURIComponent($data.data('buttons')));
		var $extensions = JSON.parse(decodeURIComponent($data.data('extensions')));
		var $extension_object = {};
		$custom_buttons = {};
		for (i=0; i<$extensions.length; i++) {
			$custom_buttons[$extensions[i]['name']] = new MediumButton($extensions[i]['settings']);
		}
		var $placeholder = $data.data('placeholder');
		$options =  JSON.parse(decodeURIComponent($data.data('options')));
		
		$customButtons['colorPicker'] = pickerExtension;

		var $object = {
			toolbar: {
				buttons: $buttons,
				static: $static,
				align: $align,
				relativeContainer: $container
			},
			extensions: $custom_buttons,
			placeholder: {
				text: $placeholder,
				hideOnClick: false
			},
			elementsContainer: $container
		};
		
		for (i in $options) {
			$object[i] = $options[i];
		}
		
		var editor = new MediumEditor($selector, $object);
		
		if (!editor.elements.length) {
			return;
		}
		
		// cause update to editor to trigger acf change event
		editor.subscribe('editableInput', function(e, editable) {
			$($selector).trigger('change');
		});
	}
	if(typeof acf.add_action !== 'undefined') {
		acf.add_action('ready append', function( $el ){
			acf.get_fields({ type : 'medium_editor'}, $el).each(function(){
				initialize_acf_medium_editor_field($(this));
			});
		});
	} else {
		$(document).on('acf/setup_fields', function(e, postbox){
			$(postbox).find('.field[data-field_type="medium_editor"]').each(function(){
				initialize_acf_medium_editor_field($(this));
			});
		});
	}
})(jQuery);
