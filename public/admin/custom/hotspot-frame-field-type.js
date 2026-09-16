/**
 * Sveltia CMS — Custom Field Type "hotspot-frame" (V0.1)
 * -------------------------------------------------------------------
 * A drag-and-drop control for positioning/resizing a
 * frame defined in % (x, y, width, height) directly on the scroller image,
 * instead of filling in 4 separate numeric fields. 
 *
 * The frame is always kept fully inside the image: it can be moved and
 * resized freely, but never dragged past any edge. This is enforced in
 * three places: while dragging (startDrag), when reading a stored value
 * (getFrame/clampFrame), and at save time (isValid). Keep this in sync
 * with the equivalent bounds in content-schema.ts, otherwise a frame
 * could pass validation here but still fail the Zod check at build time
 * (or vice versa).
 *
 * Stored value (a single field instead of 4):
 *   frame:
 *     x: 12.3
 *     y: 45.6
 *     width: 30
 *     height: 20
 *
 * Usage in a collection field:
 *   - name: frame
 *     label: Position and size
 *     widget: hotspot-frame
 */

(function () {
  var MIN_SIZE = 3; // box minimal size, in %

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  function round1(v) {
    return Math.round(v * 10) / 10;
  }

  // Sanitizes a frame so it always stays fully inside the image:
  // width/height are bounded first (between MIN_SIZE and 100), then x/y
  // are bounded so that x + width <= 100 and y + height <= 100. Used
  // both when reading a stored value and as a safety net during drag.
  function clampFrame(frame) {
    var width = clamp(frame.width, MIN_SIZE, 100);
    var height = clamp(frame.height, MIN_SIZE, 100);
    var x = clamp(frame.x, 0, 100 - width);
    var y = clamp(frame.y, 0, 100 - height);
    return { x: round1(x), y: round1(y), width: round1(width), height: round1(height) };
  }

  // Control (editable part)

  var FrameControl = createClass({
    getDefaultFrame: function () {
      return { x: 25, y: 25, width: 30, height: 30 };
    },

    getFrame: function () {
      var value = this.props.value;
      var def = this.getDefaultFrame();
      var raw =
        value && typeof value === 'object'
          ? {
              x: typeof value.x === 'number' ? value.x : def.x,
              y: typeof value.y === 'number' ? value.y : def.y,
              width: typeof value.width === 'number' ? value.width : def.width,
              height: typeof value.height === 'number' ? value.height : def.height,
            }
          : def;
      return clampFrame(raw);
    },

    handleReset: function () {
      this.props.onChange(this.getDefaultFrame());
    },

    // Rejects corrupted/missing data, and any frame that would extend
    // outside the image — the frame must always be fully contained.
    isValid: function (value) {
      if (!value || typeof value !== 'object') {
        return { error: { message: 'The hotspot frame must be set.' } };
      }

      var hasValidNumbers = ['x', 'y', 'width', 'height'].every(function (key) {
        return typeof value[key] === 'number' && isFinite(value[key]);
      });

      if (!hasValidNumbers) {
        return { error: { message: 'x, y, width and height must all be numbers.' } };
      }

      if (value.width <= 0 || value.height <= 0) {
        return { error: { message: 'Width and height must be greater than zero.' } };
      }

      if (value.x < 0 || value.y < 0) {
        return { error: { message: 'The frame cannot start outside the image (x and y must be >= 0).' } };
      }

      if (value.x + value.width > 100) {
        return { error: { message: 'The frame extends past the right edge of the image.' } };
      }

      if (value.y + value.height > 100) {
        return { error: { message: 'The frame extends past the bottom edge of the image.' } };
      }

      return true;
    },

    // mode: 'move' or 'resize'
    startDrag: function (mode, e) {
      e.preventDefault();
      e.stopPropagation();

      var container = this._container;
      if (!container) {
        return;
      }

      var rect = container.getBoundingClientRect();
      var startX = e.clientX;
      var startY = e.clientY;
      var startFrame = this.getFrame();
      var self = this;

      var onMove = function (moveEvent) {
        var dxPercent = ((moveEvent.clientX - startX) / rect.width) * 100;
        var dyPercent = ((moveEvent.clientY - startY) / rect.height) * 100;

        var next = {
          x: startFrame.x,
          y: startFrame.y,
          width: startFrame.width,
          height: startFrame.height,
        };

        if (mode === 'move') {
          next.x = clamp(startFrame.x + dxPercent, 0, 100 - startFrame.width);
          next.y = clamp(startFrame.y + dyPercent, 0, 100 - startFrame.height);
        } else if (mode === 'resize') {
          next.width = clamp(startFrame.width + dxPercent, MIN_SIZE, 100 - startFrame.x);
          next.height = clamp(startFrame.height + dyPercent, MIN_SIZE, 100 - startFrame.y);
        }

        next.x = round1(next.x);
        next.y = round1(next.y);
        next.width = round1(next.width);
        next.height = round1(next.height);

        self.props.onChange(next);
      };

      var onUp = function () {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },

    render: function () {
      var entry = this.props.entry;
      var imagePath = entry ? entry.getIn(['data', 'image']) : null;
      var frame = this.getFrame();
      var self = this;

      return h(
        'div',
        { id: this.props.forID, style: { display: 'flex', flexDirection: 'column', gap: '8px' } },

        !imagePath &&
          h(
            'p',
            { style: { color: '#999', fontStyle: 'italic', margin: 0 } },
            'You must first add an image to the scroller so you can position the frame.',
          ),

        imagePath &&
          h(
            'div',
            {
              ref: function (el) {
                self._container = el;
              },
              style: {
                position: 'relative',
                display: 'inline-block',
                maxWidth: '100%',
                lineHeight: 0,
                userSelect: 'none',
                overflow: 'hidden', // never show a frame past the image
              },
            },
            h('img', {
              src: imagePath,
              alt: '',
              draggable: false,
              style: { display: 'block', maxWidth: '100%', height: 'auto', pointerEvents: 'none' },
            }),
            h(
              'div',
              {
                onMouseDown: function (e) {
                  self.startDrag('move', e);
                },
                style: {
                  position: 'absolute',
                  left: frame.x + '%',
                  top: frame.y + '%',
                  width: frame.width + '%',
                  height: frame.height + '%',
                  border: '2px solid #06c',
                  background: 'rgba(0, 102, 204, 0.15)',
                  boxSizing: 'border-box',
                  cursor: 'move',
                },
              },
              h('div', {
                onMouseDown: function (e) {
                  self.startDrag('resize', e);
                },
                title: 'Resize',
                style: {
                  position: 'absolute',
                  right: '-6px',
                  bottom: '-6px',
                  width: '12px',
                  height: '12px',
                  background: '#06c',
                  border: '2px solid #06c',
                  borderRadius: '50%',
                  cursor: 'nwse-resize',
                },
              }),
            ),
          ),

        h(
          'div',
          {
            style: {
              fontSize: '12px',
              color: '#666',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
            },
          },
          h('span', {}, 'X : ' + frame.x + '%'),
          h('span', {}, 'Y : ' + frame.y + '%'),
          h('span', {}, 'Width : ' + frame.width + '%'),
          h('span', {}, 'Heigt : ' + frame.height + '%'),
          h(
            'button',
            {
              type: 'button',
              onClick: this.handleReset,
              style: { marginLeft: 'auto', fontSize: '11px', padding: '2px 8px', cursor: 'pointer' },
            },
            'Reset',
          ),
        ),
      );
    },
  });

  CMS.registerFieldType('hotspot-frame', FrameControl);
})();