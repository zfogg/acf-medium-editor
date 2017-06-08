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
      contentDefault: "<span class='editor-color-picker'>Color Picker<span>",

      init: function() {
    this.button = this.document.createElement('button');
    this.button.classList.add('medium-editor-action');
    this.button.innerHTML = '<b title="Color Picker" style="color: #1A2;"><i class="dashicons dashicons-art"></i></b>';
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
        color:                '#fff',
        flat:                 true,
        showInput:            true,
        showInitial:          true,
        allowEmpty:           true,
        showAlpha:            false,
        disabled:             false,
        localStorageKey:      'medium_editor_spectrum',
        showPalette:          false,
        showPaletteOnly:      false,
        togglePaletteOnly:    false,
        showSelectionPalette: false,
        clickoutFiresChange:  true,
        preferredFormat:      'hex',
        //cancelText: string,
        //chooseText: string,
        //togglePaletteMoreText: string,
        //togglePaletteLessText: string,
        //containerClassName: string,
        //replacerClassName: string,
        //maxSelectionSize: int,
        //palette: [[string]],
        //selectionPalette: [string]

        change: function(color) { setColor(color); },
        hide:   function(color) { setColor(color); },
      });
  }

  function acf_get_medium_editor_selector($el, $selector) {
    // because of repeaters, flex fields and clones
    // selector needs to be absolutely specific
    if ($selector !== '') {
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

    var $buttons = JSON.parse(decodeURIComponent($data.data('buttons')));
    var $extensions = JSON.parse(decodeURIComponent($data.data('extensions')));
    $custom_buttons = {};
    for (i=0; i<$extensions.length; i++) {
      $custom_buttons[$extensions[i].name] = new MediumButton($extensions[i].settings);
    }
    var $placeholder = $data.data('placeholder');
    $options =  JSON.parse(decodeURIComponent($data.data('options')));

    $buttons.push({
      contentDefault: '<b title="Font Name"><i class="dashicons dashicons-editor-spellcheck"></i></b>',
      name:            'fontname',
    });

    $buttons.push({
      contentDefault: '<b title="Font Size"><i class="dashicons dashicons-admin-settings"></i></b>',
      name:            'fontsize',
    });

    $custom_buttons.colorPicker = pickerExtension;

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

    for (var i in $options) {
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
