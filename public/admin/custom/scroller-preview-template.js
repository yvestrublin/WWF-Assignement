/** 
* Sveltia CMS — Custom Preview Template for the “scrollers” collection 
* ----------------------------------------------------------------- 
* Displays the scroller image and, on top of it, a frame for each block 
* "hotspots" type (positions/sizes in %: x, y, width, height). 
* As the Sveltia preview pane re-renders with each modification of 
* upon entry, the frames move/resize LIVE as soon as you 
* change x, y, width or height in the form. 
*/
(function () {
    // Name of the "type" field used by Sveltia to distinguish types
    // in a "types" list (typeKey option, defaults to "type").
    var HOTSPOT_TYPE = 'hotspots';
    
    // Convert a value—which could be an Immutable.List,
    // a standard JS array, or undefined/null—into a "flat" JS array.
    function toPlainArray(value) {
        if (!value) {
            return [];
        }
        if (typeof value.toJS === 'function') {
            return value.toJS();
        }
        return Array.isArray(value) ? value : [];
    }
    
    var ScrollerPreview = createClass({
        render: function () {
            var entry = this.props.entry;
            var getAsset = this.props.getAsset;
            
            var title = entry.getIn(['data', 'title']) || '';
            var imagePath = entry.getIn(['data', 'image']);
            var imageAsset = imagePath ? getAsset(imagePath) : null;
            
            var blocks = toPlainArray(entry.getIn(['data', 'blocks']));
            var hotspots = blocks.filter(function (block) {
                return block && block.type === HOTSPOT_TYPE;
            });
            
            return h(
                'div',
                { style: { fontFamily: 'sans-serif', padding: '16px', boxSizing: 'border-box' } },
                
                title &&
                h(
                    'h1',
                    { style: { fontSize: '18px', margin: '0 0 12px', fontWeight: 600 } },
                    title,
                ),
                
                !imageAsset &&
                h(
                    'p',
                    { style: { color: '#999', fontStyle: 'italic' } },
                    'Add an image to display the hotspot preview.',
                ),
                
                imageAsset &&
                h(
                    'div',
                    {
                        // position: relative + lineHeight: 0 -> percentage-based frames
                        // align exactly with the image, regardless of its displayed
                        // size (responsive)
                        style: {
                            position: 'relative',
                            display: 'inline-block',
                            maxWidth: '100%',
                            lineHeight: 0,
                        },
                    },
                    h('img', {
                        src: imageAsset.url,
                        alt: title,
                        style: { display: 'block', maxWidth: '100%', height: 'auto' },
                    }),
                    hotspots.map(function (hotspot, index) {
                        var x = hotspot.frame.x;
                        var y = hotspot.frame.y;
                        var width = hotspot.frame.width;
                        var height = hotspot.frame.height;
                        
                        // Only display hotspots for which all four values ​​are defined
                        var hasCoords = [x, y, width, height].every(function (v) {
                            return v !== undefined && v !== null && !isNaN(v);
                        });
                        
                        if (!hasCoords) {
                            return null;
                        }
                        
                        var label = hotspot.title || 'Hotspot ' + (index + 1);
                        
                        return h(
                            'div',
                            {
                                key: hotspot.id || index,
                                style: {
                                    position: 'absolute',
                                    left: x + '%',
                                    top: y + '%',
                                    width: width + '%',
                                    height: height + '%',
                                    border: '2px solid #06c',
                                    background: 'rgba(0, 102, 204, 0.15)',
                                    boxSizing: 'border-box',
                                    pointerEvents: 'none',
                                },
                            },
                            h(
                                'span',
                                {
                                    style: {
                                        position: 'absolute',
                                        top: '-1.5em',
                                        left: 0,
                                        fontSize: '11px',
                                        lineHeight: 1.5,
                                        background: '#06c',
                                        color: '#fff',
                                        padding: '1px 6px',
                                        borderRadius: '3px',
                                        whiteSpace: 'nowrap',
                                    },
                                },
                                label,
                            ),
                        );
                    }),
                ),
            );
        },
    });
    
    CMS.registerPreviewTemplate('scrollers', ScrollerPreview);
})();