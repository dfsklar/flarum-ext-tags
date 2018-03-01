import Modal from 'flarum/components/Modal';
import Button from 'flarum/components/Button';
import { slug } from 'flarum/utils/string';

import tagLabel from 'flarum/tags/helpers/tagLabel';



export default class ApproveWannabeMembersModal extends Modal {

  init() {
    super.init();

    this.group = this.props.group;
    this.users = this.props.users;
    this.onHide = this.props.onHide;
  }

  onhide() {
    if (this.onHide) {
      this.onHide();
    }
  }

  className() {
    return 'ApproveWannabeMembersModal Modal--small';
  }

  title() {
      return "Approve Membership Applicants";
  }


  removeObjectByID(arr, id) {
    return  $.grep(arr, function(x) {
      return x.id != id; 
    });
  }

  approve (_user) {
    app.store.find('users', _user.data.id).then(function(user) {

      var rels = user.data.relationships;
      var frisbee_to_be_tossed = {type:"groups", id: this.group.data.id};
      rels.groups.data.push(frisbee_to_be_tossed);
      rels.grouprequests.data = this.removeObjectByID(rels.grouprequests.data, frisbee_to_be_tossed.id);

      _user.inGroup = true;
      m.redraw();

      user.save({relationships: rels})
      .then(function() {
        var rels = this.group.data.relationships;
        var frisbee_to_be_tossed = {type:"users", id: user.data.id};
        rels.users.data.push(frisbee_to_be_tossed);
        rels.wannabeusers.data = this.removeObjectByID(rels.wannabeusers.data, frisbee_to_be_tossed.id);
      }.bind(this))
      .catch(() => {
        alert("Membership server is not responding. Please try again later.");
        _user.inGroup = null;
      });
    }.bind(this));
  }



  reject (_user) {
    app.store.find('users', _user.data.id).then(function(user) {
      var rels = user.data.relationships;
      const frisbee_to_be_tossed = {type:"groups", id: this.group.data.id};

      rels.grouprequests.data = this.removeObjectByID(rels.grouprequests.data, frisbee_to_be_tossed.id);
      rels.groups.data = this.removeObjectByID(rels.groups.data, frisbee_to_be_tossed.id);

      _user.inGroup = false;
      m.redraw();

      user.save({relationships: rels})
      .then(() => {
        console.log("good");
      })
      .catch(() => {
        _user.inGroup = null;
        alert("Membership server is not responding. Please try again later.");
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
            className: 'Button Button--join-approve' + ((user.inGroup===true)?' already-confirmed ':''),
            icon: 'check',
            onclick: () => SELF.approve(user)
          })}
          {Button.component({
            className: 'Button Button--join-reject' + ((user.inGroup===false)?' already-confirmed ':''),
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
          <div className='instructions'>Make changes using the checkmark or the red "X":</div>
          <div id='mount-here'>
            {this.users.map(x => showWannabeUser(x))}
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

