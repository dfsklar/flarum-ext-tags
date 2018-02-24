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
          return { name : tag.name() };
        }),
        right: [
        ]
      }
      return scope;
    }
    
    this.DND.view = function(scope) {
      var list = function(items) {
        return items.map(function(item, index) {
          return m('li', {
            index: index
          }, item.name)
        })
      }
      
      return m('.drag', {
        config: function(el, isInited) {
          if (isInited) return
          var left = el.querySelector('.left'),
            right = el.querySelector('.right')
      
          var drake = dragula([left, right])
          drake.on('drop', function(element, target, source) {
            scope.context.$latestOrder = $(target);
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

    this.tag = this.props.tag || app.store.createRecord('tags');
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

  submitData() {
    return {
      result: "TBD"
    };
  }

  onsubmit(e) {
    e.preventDefault();

    this.loading = true;

    // If the user made no change at all, immediately leave.
    if (!(this.$latestOrder)) {
      this.hide();
      return;
    }

    // Scan through this.latestOrder to determine all tags who have experienced
    // a change in position.
    this.$latestOrder.children().each(function(index, elem) {
      // index is the zero-based *new* position
      // elem.attr('index') is the zero-base *old* position
      var newIDX = index;
      var oldIDX = parseInt($(elem).attr('index'));
      if (oldIDX != newIDX) {
        var matchingTag = 
          this.tags.find(function(x){
            return (x.data.attributes.position == oldIDX);
          });
        // Change the position number for this tag
        matchingTag.data.attributes.position = newIDX;
        matchingTag.save({position: newIDX}).then(
          () => this.hide(),
          response => {
            this.loading = false;
            this.handleErrors(response);
          }
        );
      }
    }.bind(this));
  }

  // WE MIGHT WANT TO SUPPORT DELETION SOMEDAY?
  /*
  delete() {
    if (confirm(app.translator.trans('flarum-tags.admin.edit_tag.delete_tag_confirmation'))) {
      const children = app.store.all('tags').filter(tag => tag.parent() === this.tag);

      this.tag.delete().then(() => {
        children.forEach(tag => tag.pushData({
          attributes: {isChild: false},
          relationships: {parent: null}
        }));
        m.redraw();
      });

      this.hide();
    }
  } */
}
