import Modal from 'flarum/components/Modal';
import Button from 'flarum/components/Button';
import { slug } from 'flarum/utils/string';

import tagLabel from 'flarum/tags/helpers/tagLabel';



export default class ReorderTagsModal extends Modal {

  // DRAG&DROP IS FROM: https://codepen.io/grilchgristle/pen/rmaZag


  // convenience
  init_draganddrop() {

    this.State = {
      list:  [
        {id: 0, sortIndex: 0, name: "foo"},
        {id: 1, sortIndex: 1, name: "bar"},
        {id: 2, sortIndex: 2, name: "gronk"},
        {id: 3, sortIndex: 3, name: "fleebles"},
        {id: 4, sortIndex: 4, name: "sepulveda"}
      ],
      sortedList: () => this.State.list.sort(
        (a,b) => a.sortIndex < b.sortIndex ? -1 : a.sortIndex > b.sortIndex ? 1 : 0
      )
    }

    this.dndClass = 
          (dnd, item) => item === dnd.drag ? 'dragging' : item === dnd.drop ? 'dropping' : ''

    this.DND = {
      controller: (options) => options.dnd = { drag: null, drop: null },
      view: (ctrl, options) => {
        const dnd = options.dnd;
        if (!dnd) {
          debugger;
        }
        const list = options.list();
        return m('.list'
          , {
            ondragover: (e) => e.preventDefault(),
            ondrop: (e) => {
              e.stopPropagation()
                const draggedIdx = list.indexOf(dnd.drag);
                const droppedIdx = list.indexOf(dnd.drop);
                
                const insertionIdx = draggedIdx < droppedIdx ? droppedIdx + 1 : droppedIdx;
                const deletionIdx = draggedIdx > droppedIdx ? draggedIdx + 1 : draggedIdx;

                if (insertionIdx !== deletionIdx) {
                  // your custom  code for updating the list goes here.
                  list.splice(insertionIdx, 0, dnd.drag);
                  list.splice(deletionIdx, 1);
                  
                  // this is horribly inefficient but suffices for demo purposes
                  list.forEach( (item, idx) => item.sortIndex = idx );
                }

                dnd.drag = dnd.drop = null;
            }
          }
          , list.map((item) => {
            return m('.drag-item[draggable]'
              , {
                  key: item.id,
                  class: this.dndClass(dnd, item),  // <<< dnd is UNDEFINED here
                  ondragstart: () => dnd.drag = item,
                  ondragover: () => { if (dnd.drag) dnd.drop = item }
              }
              , item.name
            )
          })
        )
      }
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


  xxxx() {
    return (
      <div className="Modal-body">
        <div className="Form">

          { m('.dndddd', this.DND, { list: this.State.sortedList }) }

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
