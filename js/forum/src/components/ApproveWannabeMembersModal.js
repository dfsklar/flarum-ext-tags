import Modal from 'flarum/components/Modal';
import Button from 'flarum/components/Button';
import { slug } from 'flarum/utils/string';

import tagLabel from 'flarum/tags/helpers/tagLabel';



export default class ApproveWannabeMembersModal extends Modal {

  init() {
    super.init();

    this.group = this.props.group;
  }

  className() {
    return 'ApproveWannabeMembersModal Modal--small';
  }

  title() {
      return "Approve Membership Applicants";
  }


  showWannabeUser(user) {
    return (
      <div className='wannabe-user'>
        <input type="checkbox"/>
        <input type="checkbox"/>
        <div className='name'>Bob Schmo</div>
      </div>
    )
  }


  content() {
    return (
      <div className="Modal-body">
        <div className="Form">

          <div id='mount-here'>
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

    // A diff redraw won't work here, because sortable has mucked around
    // with the DOM which will confuse Mithril's diffing algorithm. Instead
    // we force a full reconstruction of the DOM.
    m.redraw.strategy('all');
    m.redraw();
  }

}

