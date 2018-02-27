import Modal from 'flarum/components/Modal';
import Button from 'flarum/components/Button';
import { slug } from 'flarum/utils/string';

import tagLabel from 'flarum/tags/helpers/tagLabel';



export default class ApproveWannabeMembersModal extends Modal {

  init() {
    super.init();

    this.group = this.props.group;
    this.users = this.props.users;
  }

  className() {
    return 'ApproveWannabeMembersModal Modal--small';
  }

  title() {
      return "Approve Membership Applicants";
  }


  approve (user) {
    app.store.find('users', user.data.id).then(function(user) {
      var rels = user.data.relationships;  ///.grouprequests.data
      const frisbee_to_be_tossed = {type:"groups", id: this.group.data.id};

      rels.groups.data.push(frisbee_to_be_tossed);

      // Delete by doing a grep on all requests NOT matching this one.
      rels.grouprequests.data = 
         $.grep(rels.grouprequests.data, function(x) {
           return x.id != frisbee_to_be_tossed.id; 
         });

      user.save({relationships: rels})
      .then(() => {
        alert("The user has been added to this group.");
        user.inGroup = 'Y';
        console.log("good");
      })
      .catch(() => {
        user.inGroup = 'N';
        console.log("bad");
      });
    }.bind(this));
  }


  
  content() {

    const SELF = this;

    function showWannabeUser(user) {
      return (
        <div className='wannabe-user'>
          {Button.component({
            className: 'Button Button--join-approve',
            icon: 'check',
            onclick: () => SELF.approve(user)
          })}
          {Button.component({
            className: 'Button Button--join-reject',
            icon: 'times-circle',
            onclick: () => SELF.reject(user)
          })}
          <div className='name'>{user.data.attributes.displayName}</div>
        </div>
      )
    }

    return (
      <div className="Modal-body">
        <div className="Form">

          <div id='mount-here'>
            {this.users.map(x => showWannabeUser(x))}
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

