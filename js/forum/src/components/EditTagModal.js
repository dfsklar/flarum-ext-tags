import Modal from 'flarum/components/Modal';
import Button from 'flarum/components/Button';
import { slug } from 'flarum/utils/string';

import tagLabel from 'flarum/tags/helpers/tagLabel';

/**
 * The `EditTagModal` component shows a modal dialog which allows the user
 * to create or edit a tag.
 */
export default class EditTagModal extends Modal {
  init() {
    super.init();

    this.tag = this.props.tag || app.store.createRecord('tags');

    this.name = m.prop(this.tag.name() || '');
    this.slug = m.prop(this.tag.slug() || '');
    this.description = m.prop(this.tag.description() || '');
    this.color = m.prop(this.tag.color() || '');
    this.isHidden = m.prop(this.tag.isHidden() || false);
  }

  className() {
    return 'EditTagModal Modal--small';
  }

  title() {
    return ( <b>Edit Session Title/Description</b> );
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="Form">
          <div className="Form-group">
            <label>Short Title</label>
            <input className="FormControl" placeholder={app.translator.trans('flarum-tags.admin.edit_tag.name_placeholder')} value={this.name()} oninput={e => {
              this.name(e.target.value);
              // DFSKLARD: This was damaging the slug!  I want the slug to act as a persistent ID.
            }}/>
          </div>

          <div className="Form-group hidden">
            <label>{app.translator.trans('flarum-tags.admin.edit_tag.slug_label')}</label>
            <input className="FormControl" value={this.slug()} oninput={m.withAttr('value', this.slug)}/>
          </div>

          <div className="Form-group">
            <label>Description</label>
            <textarea className="FormControl" value={this.description()} oninput={m.withAttr('value', this.description)}/>
          </div>

          <div className="hidden">
            <label>{app.translator.trans('flarum-tags.admin.edit_tag.color_label')}</label>
            <input className="FormControl" placeholder="#aaaaaa" value={this.color()} oninput={m.withAttr('value', this.color)}/>
          </div>

          <div className="hidden">
            <div>
              <label className="checkbox">
                <input type="checkbox" value="1" checked={this.isHidden()} onchange={m.withAttr('checked', this.isHidden)}/>
                {app.translator.trans('flarum-tags.admin.edit_tag.hide_label')}
              </label>
            </div>
          </div>

          <div className="Form-group">
            {Button.component({
              type: 'submit',
              className: 'Button Button--primary EditTagModal-save',
              loading: this.loading,
              children: [ 'Submit' ]
            })}

            {( false && this.tag.exists) ? (
              <button type="button" className="Button EditTagModal-delete" onclick={this.delete.bind(this)}>
                {app.translator.trans('flarum-tags.admin.edit_tag.delete_tag_button')}
              </button>
            ) : ''}
          </div>
        </div>
      </div>
    );
  }

  submitData() {
    return {
      name: this.name(),
      slug: this.slug(),
      description: this.description(),
      color: this.color(),
      isHidden: this.isHidden()
    };
  }

  onsubmit(e) {
    e.preventDefault();

    this.loading = true;

    // DFSKLARD save tag changes
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
