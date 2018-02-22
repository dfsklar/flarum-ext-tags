import Modal from 'flarum/components/Modal';
import Button from 'flarum/components/Button';
import { slug } from 'flarum/utils/string';

import tagLabel from 'flarum/tags/helpers/tagLabel';



export default class ReorderTagsModal extends Modal {
  init() {
    super.init();

    this.tag = this.props.tag || app.store.createRecord('tags');

    this.currenTagList = [ this.tag ];
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
