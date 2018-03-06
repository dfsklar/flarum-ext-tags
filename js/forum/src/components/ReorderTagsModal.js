import Modal from 'flarum/components/Modal';
import Button from 'flarum/components/Button';
import { slug } from 'flarum/utils/string';

import tagLabel from 'flarum/tags/helpers/tagLabel';



export default class ReorderTagsModal extends Modal {


  // DRAG&DROP CODE IS FROM: https://codepen.io/hendrikroth/pen/RWWrGo?editors=001


  init_draganddrop() {

    var scope = this.tags;

    this.DND = {};

    this.DND.controller = function(options) {
      var scope = {
        context: options.context,
        left: options.tags.reverse().map(function (tag) {
          return { 
            name : tag.name(),
            tagID: tag.id(),
            position: tag.data.attributes.position,
            hidden: tag.data.attributes.isHidden 
          };
        }),
        right: [
        ]
      }
      return scope;
    }
    
    this.DND.view = function(scope) {
      var indexLastVisibleSession = 0;
      var list = function(items) {
        var retval = items.map(function(item, index) {
          if (!(item.hidden))
            indexLastVisibleSession = index;
          return m('li', {
            position: item.position,
            tagID: item.tagID
          }, item.name)
        });
        retval.splice(indexLastVisibleSession+1, 0, 
          <div class='vis-invis'>
             <div>&#8679; VISIBLE to members &#8679;</div><hr/>
          </div>
        );
        return retval;
      }
      
      return m('.drag', {
        config: function(el, isInited) {
          if (isInited) return
          var left = el.querySelector('.left'),
            right = el.querySelector('.right')
      
          var drake = dragula([left, right])
          drake.on('drop', function(element, target, source) {
            scope.context.$latestOrder = $(target);
            if ($($(target).children()[0]).attr('class') == "vis-invis gu-transit") {
              alert("Warning: Your members will be allowed to see the very first session.  Every group must have at least one visible session.");
            }
            // This cloning of the target is the only way to persist the
            // order the user has chosen.  $(target) will be a jQuery 
            // pointer to the "OL" element so:
            // $(target).children().first().attr('index')
            // $(target).children().each(...)   
            // etc
          })
       }
      }, [
        m('ol.left', list(scope.left))
      ])
    }
  }



  init() {
    super.init();

    this.tag = this.props.current_tag || app.store.createRecord('tags');
    this.tags = this.props.tags;

    this.init_draganddrop();
  }

  className() {
    return 'ReorderTagsModal Modal--small';
  }

  title() {
      return "Reorder Sessions";
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="Form">

          <div className='instructions'>Reorder by dragging:</div>

          <div id='mount-here'>
            {m.component(this.DND, {tags: this.tags, context: this})}
          </div>

          <div className="Form-group">
            {Button.component({
              type: 'submit',
              className: 'Button Button--primary EditTagModal-save',
              loading: this.loading,
              children: [ 'Submit' ]
            })}
          </div>
        </div>
      </div>
    );
  }

  onsubmit(e) {
    e.preventDefault();

    this.loading = true;

    // If the user made no change at all, immediately leave.
    if (!(this.$latestOrder)) {
      this.hide();
      return;
    }

    // Scan through this.latestOrder and recompute all positions.
    this.parentTag = null;
    this.idsOfChildrendInOrder = [];
    this.visiblePortion = true;
    this.curSessionNumber = 0;
    this.$latestOrder.children().each(function(index, elem) {
      if (elem.localName == 'li') {
        // index is the zero-based *new* position
        // elem.attr('index') is the zero-base *old* position
        this.curSessionNumber += 1;
        var newIDX = index;
        var tagID = parseInt($(elem).attr('tagID'));
        var matchingTag =
          this.tags.find(function(x){
            return (x.id() == tagID);
          });
        matchingTag.sessionNumber = this.curSessionNumber;
        this.parentTag = matchingTag.parent();
        this.idsOfChildrendInOrder.push(
          {
            id: parseInt(matchingTag.id()),
            visible: this.visiblePortion
          }
        );
        // Change the position number for this tag, just in local store
        const tagFromStore = app.store.getById('tags', matchingTag.id());
        tagFromStore.sessionNumber = this.curSessionNumber;
        tagFromStore.pushData({
            attributes: {
              position: newIDX,
              isChild: true,
              isHidden: !(this.visiblePortion)
            },
            relationships: {parent: this.parentTag}
        });
      } else {
        this.visiblePortion = false;
      }
    }.bind(this));

    // Create an "ordering tree" that is compatible with the needs of the API, e.g.:
    // { id: 5, children: [ 6, 7, 9 ]}
    const orderSpec = {
      id: parseInt(this.parentTag.id()),
      children: this.idsOfChildrendInOrder
    };
    app.request({
      url: app.forum.attribute('apiUrl') + '/tags/order',
      method: 'POST',
      data: {orderviz: [orderSpec]}
    });

    this.hide();

    // In later mithril, this would be m.route.set...
    // but in mithril 0.2, it's an overloaded use of m.route with one param:
    
    m.redraw(true);
    m.route('/t/' + this.tag.data.attributes.slug + '?redraw=8392');
    m.redraw(true);
  

    // window.location.href = '/t/' + this.tag.data.attributes.slug + '?foo=bar';

    // A diff redraw won't work here, because sortable has mucked around
    // with the DOM which will confuse Mithril's diffing algorithm. Instead
    // we force a full reconstruction of the DOM.
    
    m.redraw.strategy('all');
    m.redraw();
  }
}
