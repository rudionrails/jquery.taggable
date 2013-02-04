/*!
 *
 * jquery.taggable
 * Add tagging capabilities to any text input element
 *
 * @author Rudolf Schmidt <me@rudionrails.com>
 * @copyright Rudolf Schmidt 2011-2013
 * @license MIT <http://opensource.org/licenses/mit-license.php>
 * @link http://www.github.com/rudionrails/jquery.taggable
 * @module jquery.taggable
 * @version 1.0.0
 *
 */
;(function($) {

  $.taggableDefaultOptions = {
    delimiter: ',',                   // delimiter for separating tags 
    defaultText: 'Add a tag',         // default text on the input 
    defaultRemoveText: 'Remove tag',  // title tag on tag remove link
    minChars: 1,                      // at least one character must be typed to add a tag
    autocomplete: false               // takes jquery-ui autocomplete options
  }

  $.fn.taggable = function( options ) {
    var options = $.extend( $.taggableDefaultOptions, options );

    $(this).each( function() {
      new Taggable(this, options);
    });
  };

  // http://stackoverflow.com/questions/1288297/jquery-auto-size-text-input-not-textarea
  $.fn.taggableAutoGrow = function(options) {
    var options = $.extend({
      maxWidth: 1000,
      minWidth: 0,
      comfortZone: 10
    }, options );

    $(this).each( function() {
      var minWidth = options.minWidth || $(this).width(),
        val = '',
        tester = $( '<tester />' ).css({
          position: 'absolute',
          top: -9999,
          left: -9999,
          width: 'auto',
          fontSize: $(this).css('fontSize'),
          fontFamily: $(this).css('fontFamily'),
          fontWeight: $(this).css('fontWeight'),
          letterSpacing: $(this).css('letterSpacing'),
          whiteSpace: 'nowrap'
        });

      $(this).after( tester ).
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
            newWidth = (testerWidth + options.comfortZone) >= minWidth ? testerWidth + options.comfortZone : minWidth,
            currentWidth = $(this).width(),
            isValidWidthChange = (newWidth < currentWidth && newWidth >= minWidth) || 
              (newWidth > minWidth && newWidth < options.maxWidth);

          // Animate width
          if (isValidWidthChange) $(this).width(newWidth); 
        }).
        focusout(); // trigger
    });
  };


  // === Taggable class
  var Taggable = function( original, options ) {
    this.options = options;

    this.replacement = $('<div>', { 'class': 'taggable-wrapper', tabIndex: -1 }).data( 'taggable', this ).append( 
      $('<input>', { 'class': 'taggable-hidden', type: 'hidden', name: $(original).attr('name') }), 
      $('<input>', { 'class': 'taggable-input', value: $(original).attr('placeholder') || options.defaultText })
    );

    // replace original with taggable elements
    this._replace( original );

    // autocomplete if applicable
    if( options.autocomplete != false ) {
      this._autocomplete();
    }
  };

  // taggable instance methods
  $.extend( Taggable.prototype, {
    // add a new tag
    add: function( val ) {
      if( this.options.minChars > $.trim(val).length ) return; // early exit

      // add the tag
      $( '.taggable-input', this.replacement ).before( 
        $( '<span>', { 'class': 'taggable-tag' } ).mouseover( function() {
          $(this).addClass( 'hover' );
        }).mouseout( function() {
          $(this).removeClass( 'hover' );
        }).append(
          $.trim(val),
          $( '<a>', { 'class': 'taggable-close', href: '#', title: this.options.defaultRemoveText }).
            html('&nbsp;').
            data( 'taggable', this ).
            click( function() {
              $(this).data( 'taggable' ).remove( $(this).parent() );
            })
        )
      );

      // add the value to the hidden field
      this._update();
    },

    // removed the given tag element or the last one (if none given)
    remove: function( element ) {
      var element = element || $( '.taggable-tag:last', this.replacement );

      $(element).remove();
      this._update();
    },


    // replaces the original element with the taggable ones
    _replace: function( original ) {
      var _this   = this,
          options = this.options;

      // add default tags
      $.each( $(original).val().split(options.delimiter), function(index, value) {
        _this.add( value ); 
      });

      // define some behaviour on replacement elements
      $( this.replacement ).on( 'focus', function(event) {
        $( '.taggable-input', $(this) ).focus();
      });

      // remove default text on focus
      $( '.taggable-input', this.replacement ).on( 'focus', this, function(event) {
        if( $.trim( $(this).val() ) == event.data.options.defaultText ) {
          $(this).val( '' );
        }

      }).on( 'blur', this, function(event) {
        // display default text on blue (if value is empty)
        if( $.trim( $(this).val() ) == '' ) {
          $(this).val( event.data.options.defaultText );
        }
      }).on( 'keypress', this, function(event) {
        // do nothing if first key is space and element is empty
        if( event.which == 32 && $.trim($(this).val()) == "" ) {
          return false;
        }

        // if delimiter (comma by default), tab or return then add a tag
        if( event.which == event.data.options.delimiter.charCodeAt(0) || event.which == 9 || event.which == 13 ) {
          event.data.add( $(this).val() );
          $(this).val( '' ); //reset value

          return false;

        // if backspace, then remove last tag
        } else if( event.which == 8 && $.trim($(this).val()) == "" ) {
          event.data.remove();
        }
      });

      // let the input grow with the typed text
      $( '.taggable-input', this.replacement ).taggableAutoGrow();

      // add replacement and then remove the original
      $(original).after(this.replacement).remove();
    },

    _update: function() {
      var values = $( '.taggable-tag', this.replacement ).map( function() {
        return $.trim( $(this).text() );
      }).get().join( this.options.delimiter );

      $( '.taggable-hidden', this.replacement ).val( values );
    },

    _autocomplete: function() {
      // jquery-ui autocomplete
      if( typeof $.fn.autocomplete == "function" ) {
        $( '.taggable-input', this.replacement ).autocomplete( this.options.autocomplete );
      }
    }
  });

})(jQuery);

