import Modal from 'flarum/components/Modal';
import Button from 'flarum/components/Button';
import { slug } from 'flarum/utils/string';

import tagLabel from 'flarum/tags/helpers/tagLabel';



export default class ReorderTagsModal extends Modal {




  // DRAG&DROP IS FROM: https://codepen.io/hendrikroth/pen/RWWrGo?editors=001



  init_draganddrop() {

    this.app = {};

    this.app.controller = function() {
      var scope = {
        left: [
          {name: 'Test1'},
          {name: 'Test2'},
          {name: 'Test3'},
          {name: 'Test4'},
          {name: 'Test5'},
          {name: 'Test6'}
        ],
        right: [
          {name: 'Test7'},
          {name: 'Test8'}
        ]
      }
      return scope
    }
    
    this.app.view = function(scope) {
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
        m('ul.left', list(scope.left)),
        m('ul.right', list(scope.right))
      ])
    }
  }



  init() {
    super.init();
    this.init_draganddrop();

    this.tag = this.props.tag || app.store.createRecord('tags');
    this.tags = this.props.tags;
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
            {m.component(this.app)}
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
