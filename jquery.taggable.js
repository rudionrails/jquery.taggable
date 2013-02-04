/*!
 *
 * jquery.taggable
 * Add tagging capabilities to any text input element
 *
 * @author Rudolf Schmidt <me@rudionrails.com>
 * @copyright Rudolf Schmidt 2011-2013
 * @license MIT
 * @link http://www.github.com/rudionrails/jquery.taggable
 * @module jquery.taggable
 * @version 1.0.0
 *
 */
;(function($) {

  /*
   * The default options for the taggable plugin
   */
  $.taggableDefaultOptions = {
    // delimiter for separating tags
    delimiter: ',',

    // set a prefix for the tag to begin with (or else it won't be accepted)
    prefix: null,

    // set a suffix for the tag to end with (or else it won't be accepted)
    suffix: null,

    // default text on the input
    placeholder: 'Add a tag',

    // title tag on tag remove link
    defaultRemoveText: 'Remove tag',

    // at least one character must be typed to add a tag
    minChars: 1,

    // takes jquery-ui autocomplete options
    autocomplete: false,

    // options for automatically growing the (replaced) input field
    autoGrow: {
      maxWidth: 1000,
      minWidth: 0,
      comfortZone: 10
    }
  }

  /*
   * The jquery.taggable plugin applies to all matching elements.
   *
   * It takes an options hash which it merged with the default options (in case
   * you want to override things).
   */
  $.fn.taggable = function( options ) {
    var options = $.extend( $.taggableDefaultOptions, options );

    $(this).each( function() {
      new Taggable(this, options);
    });
  };


  /*
   * The taggable class is called for every selector separately.
   */
  var Taggable = function( original, options ) {
    var _original   = $(original),
        _options    = options,
        _keys       = { ENTER: 13, SPACE: 32, TAB: 9, BACKSPACE: 8 };

    /*
     * Private placeholder text
     * @type  {String}
     */
    _placeholder = $( _original ).attr('placeholder') || _options.placeholder;

    /*
     * Private RegExp to check a potential tag against
     * @type  {RegExp}
     */
    _tagRegexp = new RegExp( "^"+ [_options.prefix, _options.suffix].join("(.+)") +"$" );

    /*
     * Private replacement object
     * @type  {Object}
     */
    _replacement = $('<div>', { 'class': 'taggable-wrapper', tabIndex: -1 }).data( 'taggable', this ).append(
      $('<input>', { 'class': 'taggable-hidden', type: 'hidden', name: $(_original).attr('name') }),
      $('<input>', { 'class': 'taggable-input', value: _placeholder })
    );

    /*
     * Private replacement input
     * @type  {Object}
     */
    _replacementInput = $( _replacement ).find( '.taggable-input' );

    /*
     * Private replacement hidden field
     * @type  {Object}
     */
    _replacementHidden = $( _replacement ).find( '.taggable-hidden' );

    /*
     * Private function to fetch the tag delimiter
     *
     * @return {String} The delimiter value
     */
    _delimiter = function() {
      return _options.delimiter.charCodeAt(0);
    };

    /*
     * Private function to fetch the tags
     *
     * @return  {Array}   The list of tags
     */
    _tags = function() {
      var tags = $( _replacement ).find( '.taggable-tag' ).map( function() {
        return $.trim( $(this).text() );
      }).get().join( _delimiter() );

      return tags;
    };

    /*
     * Private function to check if the passed element's value is blank or not
     *
     * @param   {Object}  element   The DOM element to check the value against
     * @return  {Boolean} true or false
     */
    _isBlank = function( element ) {
      return $.trim( $(element).val() ) == "" ? true : false;
    };

    /*
     * Private function to check whether element's value may be a tag
     *
     * @param   {Object}  element   The DOM elemtn to check the value against
     * @return  {Boolean} true or false
     */
    _isTag = function( element ) {
      return _tagRegexp.test( $.trim( $(element).val() ) );
    };

    /*
     * Adds value as tag
     *
     * @param   {String}  val   The value to being added as tag
     * @return  {undefined}
     */
    _add = function( val ) {
      if( _options.minChars > $.trim(val).length ) return; // early exit

      var tag = $( '<span>', { 'class': 'taggable-tag' } ).html( $.trim(val) ).
        mouseover( function() {
          $(this).addClass( 'hover' );
        }).mouseout( function() {
          $(this).removeClass( 'hover' );
        });

      var close = $( '<a>', { 'class': 'taggable-close', href: '#', title: _options.defaultRemoveText }).
        html('&nbsp;').
        click( function() {
          _remove( tag );
        }).appendTo( tag );

      // add the tag
      $( _replacementInput ).before( tag );

      // add the value to the hidden field
      _update();
    };

    /*
     * Remove the given tag element or the last one (if none given)
     *
     * @params  {Object}  element   The element to remove
     * @return  {undefined}
     */
    _remove = function( element ) {
      var element = element || $( _replacement ).find( '.taggable-tag:last' );

      $(element).remove();
      _update();
    };

    /*
     * Update the hidden field (for form submission)
     *
     * @return  {undefined}
     */
    _update = function() {
      $( _replacementHidden ).val( _tags() );
    };

    /*
     * Adds event listeners
     *
     * @return  {undefined}
     */
    _addEventListeners = function() {
      // define some behaviour on replacement elements
      $( _replacement ).on( 'focus', function(event) {
        $( '.taggable-input', $(this) ).focus();
      });

      // remove default text on focus
      $( _replacementInput ).on( 'focus', function(event) {
        if( $.trim( $(this).val() ) == _placeholder ) {
          $(this).val( '' );
        }

      // display default text on blue (if value is empty)
      }).on( 'blur', function(event) {
        if( _isBlank(this) ) {
          $(this).val( _placeholder );
        }

      }).on( 'keydown keypress', function(event) {
        if( event.which == _keys.SPACE && _isBlank(this) ) return false; // early exit

        // if delimiter (comma by default), tab or enter then add a tag
        if( _isTag(this) && (event.which == _delimiter() || event.which == _keys.TAB || event.which == _keys.ENTER) ) {
          // add and reset
          _add( $(this).val() );
          $(this).val( '' );

          return false;

        // if backspace, then remove last tag
        } else if( event.which == _keys.BACKSPACE && _isBlank(this) ) {
          _remove();
        }

      });
    };

    /*
     * Applies the auto-grow feature to the input
     *
     * @see http://stackoverflow.com/questions/1288297/jquery-auto-size-text-input-not-textarea
     * @return {undefined}
     */
    _autoGrow = function() {
      var minWidth = options.minWidth || $( _replacementInput ).width(),
        val = '',
        tester = $( '<tester>' ).css({
          position: 'absolute',
          top: -9999,
          left: -9999,
          width: 'auto',
          fontSize: $( _replacementInput ).css('fontSize'),
          fontFamily: $( _replacementInput ).css('fontFamily'),
          fontWeight: $( _replacementInput ).css('fontWeight'),
          letterSpacing: $( _replacementInput ).css('letterSpacing'),
          whiteSpace: 'nowrap'
        });

      $( _replacementInput ).after( tester ).
        on( 'keyup keydown blur update', function(event) {
          if( val === (val = $(this).val()) ) return; //exit if not changed

          // Enter new content into tester
          var escaped = val.replace( /&/g, '&amp;' ).
            replace( /\s/g, ' ' ).
            replace( /</g, '&lt;' ).
            replace( />/g, '&gt;' );
          tester.html(escaped);

          // Calculate new width + whether to change
          var testerWidth = tester.width(),
            newWidth = (testerWidth + _options.autoGrow.comfortZone) >= minWidth ? testerWidth + _options.autoGrow.comfortZone : minWidth,
            currentWidth = $(this).width(),
            isValidWidthChange = (newWidth < currentWidth && newWidth >= minWidth) || 
              (newWidth > minWidth && newWidth < _options.autoGrow.maxWidth);

          // Animate width
          if (isValidWidthChange) $( _replacementInput ).width(newWidth); 
        }).
        focusout(); // trigger
    };

    /*
     * Initialize jquery.taggable
     *
     * @return  {undefined}
     */
    _init = function() {
      // add default tags
      $.each( $(_original).val().split( _delimiter() ), function(index, value) {
        _add( value );
      });

      _addEventListeners();
      _autoGrow();

      // autocomplete if applicable
      if( _options.autocomplete != false && typeof $.fn.autocomplete === "function" ) {
        $( _replacementInput ).autocomplete( _options.autocomplete );
      };

      // add replacement and then remove the original
      $(_original).after( _replacement ).remove();
    };

    // replace original with taggable elements
    _init();
  };

})(jQuery);

