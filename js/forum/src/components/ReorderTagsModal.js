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
        left: options.tags.map(function (tag) {
          return { name : tag.name() };
        }),
        right: [
        ]
      }
      return scope
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
            var i = target.getAttribute('index'),
                t = target.className
              
            if (t === 'left') {
              // keep in mind. this is not ready.
              scope.left.push(scope.right[i])
              scope.right.splice(i, 1)
            } else {
              // keep in mind. this is not ready.
              scope.right.push(scope.left[i])
              scope.left.splice(i, 1)
            }
            
            console.log(scope.left, scope.right)
          })
       }
      }, [
        m('ul.left', list(scope.left))
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
    return m.component(this.DND, { list: this.State.sortedList });
  }


  view() {
    return (
      <div className="Modal-body">
        <div className="Form">

          <div id='mount-here'>
            {m.component(this.DND, {tags: this.tags})}
          </div>

          <div className="Form-group">
            {Button.component({
              type: 'submit',
              className: 'Button Button--primary EditTagModal-save',
              loading: this.loading,
              children: app.translator.trans('flarum-tags.admin.edit_tag.submit_button')
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

    this.tag.save(this.submitData()).then(
      () => this.hide(),
      response => {
        this.loading = false;
        this.handleErrors(response);
      }
    );
  }

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
  }
}
