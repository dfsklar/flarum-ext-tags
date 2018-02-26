import Component from 'flarum/Component';
import icon from 'flarum/helpers/icon';
import LoadingIndicator from 'flarum/components/LoadingIndicator';
import SelectDropdown from 'flarum/components/SelectDropdown';
import Dropdown from 'flarum/components/Dropdown';
import UserRosterDropdown from 'flarum/components/UserRosterDropdown';
import ItemList from 'flarum/utils/ItemList';
import TagLinkButton from 'flarum/tags/components/TagLinkButton';
import EditTagModal from 'flarum/tags/components/EditTagModal';
import ReorderTagsModal from 'flarum/tags/components/ReorderTagsModal';
import Button from 'flarum/components/Button';
import LinkButton from 'flarum/components/LinkButton';
import ApproveWannabeMembersModal from './ApproveWannabeMembersModal';


export default class TagHero extends Component {

	refreshGroupMembershipInfo() {
		// So now you want to obtain the USER object for the currently logged-in user.
		// In that user object you'll find:
		//   data.relationships.groups.data which is an array.
		//     Each record in that array has a "id" object, string repr of a number.
		// The current user's ID is in:  app.data.session.userId
		this.loading = false;
		this.loggedinUserMembershipList = app.session.user.data.relationships.groups.data;
		this.isMemberOfGroup = this.loggedinUserMembershipList.some(group => (group.id == this.matchingGroup.data.id));
		m.redraw();
	}


	recordGroupRoster(r) {
		this.groupMembershipRoster = r.data.relationships.users.data;
		m.redraw();
	}


	init() {
		// We want to force a reload of this user's complete info in case its group-membership list has changed.
		this.loading = true;
	    app.store.find('users', app.session.user.id())
			.then(this.refreshGroupMembershipInfo.bind(this));

		this.tag = this.props.tag;
		this.params = this.props.params;  // IndexPage's stickyParams

		this.indexPageOwner = this.props.indexPageOwner;

		this.color = this.tag.color();
		this.parent = app.store.getById('tags', this.tag.data.relationships.parent.data.id);

		// TRY TO OBTAIN INFO ABOUT THE *GROUP* THAT MATCHES THE PARENT TAG
		this.matchingGroup = app.store.getBy('groups', 'slug', this.parent.slug());
		this.isMemberOfGroup = false;  // Meaning: we do not know yet, but a fresh reload is already taking place.

		app.store.find('groups', this.matchingGroup.data.id)
			.then(this.recordGroupRoster.bind(this));
			
		// Am "I" the leader of this group?
		const groupLeaderUserID = this.tag.data.attributes.leaderUserId;
		this.yesIAmTheLeaderOfThisGroup = (String(groupLeaderUserID) == String(app.session.user.data.id));
	}


	_join() {
		this.loggedinUserMembershipList = app.session.user.data.relationships.grouprequests.data;		
		this.loggedinUserMembershipList.push({type:"groups", id: this.matchingGroup.data.id});
		app.session.user.save({relationships: app.session.user.data.relationships})
		.then(() => {
			this.isMemberOfGroup = false;
			this.hasRequestedMembership = true;
			this.loading = false;
			alert("Thanks for your interest!  You will receive email when your membership has been approved.");
			console.log("good");
			m.redraw();
		})
		.catch(() => {
			this.loading = false;
			console.log("bad");
			m.redraw();
		});
	}

	join () {
		// So: let's try to effect the actual joining of a group from here.
		this.loading = true;
		app.store.find('users', app.session.user.id())
			.then(this._join.bind(this));			
	}





	_unjoin() {
		this.loggedinUserMembershipList = app.session.user.data.relationships.groups.data;
		const _find = function(element) {
			return (element.type=='groups' && element.id == this.matchingGroup.data.id);
		}

		const idxToDelete = this.loggedinUserMembershipList.findIndex(_find.bind(this));
		if (idxToDelete >= 0) {
			this.loggedinUserMembershipList.splice(idxToDelete, 1);
		}
		app.session.user.save({relationships: app.session.user.data.relationships})
		.then(() => {
			this.isMemberOfGroup = false;
			this.loading = false;
			this.indexPageOwner.assertMembership(false);
			m.redraw();
		})
		.catch(() => {
			this.loading = false;
			alert("Removal from group failed.");
			m.redraw();
		});
	}

	unjoin () {
		// So: let's try to effect the actual unjoining of a group from here.
		this.loading = true;
		app.store.find('users', app.session.user.id())
			.then(this._unjoin.bind(this));			
	}





  list_of_sessions() {
	const tags = app.store.all('tags');
	const currentTag = this.tag;
	
    const items = new ItemList();

    const currentPrimaryTag = 
       currentTag ? 
        ( (currentTag.isChild() ? currentTag.parent() : currentTag) ) 
        : 
        null;

    const addTag = function(tag, indexSeq, fullArray) {
      let active = (currentTag === tag);

      if (!active && currentTag) {
        active = (currentTag.parent() === tag);
      }

	  // CAREFUL: similar logic is found in addTagList.js !!!!
      if (tag.isChild() && (tag.parent() === currentPrimaryTag)) {
        items.add('tag' + tag.id(), TagLinkButton.component({
		  label: 'Session ' + String(fullArray.length-indexSeq) + " of " + String(fullArray.length),
		  idx: fullArray.length - indexSeq,
          tag: tag, 
          params: this.params, 
          active: active}), -10);
      }
    };

    // DFSKLARD: The listing of sessions.
    // DFSKLARD: my own attempts at a custom list of secondary tags to provide a list of sessions.
	// I ONLY SHOW THE subtags OF THE active primary tag.
	this.session_tags = 
		tags
		.filter(tag => 
			(tag.position() !== null) 
			&&
			tag.isChild() 
			&&
			(tag.parent() === currentPrimaryTag))
		.sort((a,b) => (b.position() - a.position()));
	this.session_tags.forEach(addTag.bind(this));
 
	return items;
  }

  

  launchSessionOrderingEditor() {
	app.modal.show(new ReorderTagsModal({tags: this.session_tags, current_tag: this.tag}));
  }

  launchWannabeApprover() {
	app.modal.show(new ApproveWannabeMembersModal(
		{
			group: this.matchingGroup,
			users: this.matchingGroup.data.relationships.wannabeusers.data.map(
				function (x) {
					return app.store.getById('users', x.id);
				}
			)
		}));
  }

  launchTagEditor() {
	app.modal.show(new EditTagModal({tag: this.tag}));
  }


  controlsForActionDropdown() {
	const items = new ItemList();

	// EDIT (only for the leader)
	// Incarnation #1:  a link back to formed.org:
	/*
	if (this.yesIAmTheLeaderOfThisGroup) {
		items.add('edit', 
			m("a", {href: app.siteSpecifics.fetchFormedURL()+"/dashboard?tab=customContent"}, 'Edit'));
	}*/
	// Incarnation #2: opening up the "edit-tag modal" dialog
	if (this.yesIAmTheLeaderOfThisGroup) {

		items.add('edit', Button.component({
			children: [ 'Edit session description' ],
			onclick: this.launchTagEditor.bind(this)
		}));

		items.add('reorder', Button.component({
			children: [ 'Reorder sessions' ],
			onclick: this.launchSessionOrderingEditor.bind(this)
		}));

		items.add('approve', Button.component({
			children: [ 'Approve join requests' ],
			onclick: this.launchWannabeApprover.bind(this)
		}));

	}


	// LEAVE GROUP (only if currently enrolled -- leaders are not allowed to leave)
	if (this.isMemberOfGroup && (!this.yesIAmTheLeaderOfThisGroup)) {
		items.add('leave', Button.component({
			children: [ 'Leave group' ],
			onclick: this.unjoin.bind(this)
		}));
	}

	return items;
  }



	
  view() {		

    /*	IF WE EVER WANT TO SHOW LEADER'S IDENTITY HERE.
		var leader = app.store.getById('users', parent.data.attributes.leaderUserId);

		// If the leader's full info is not yet fetched from API, start that process and set up the
		// promise to force a redraw of this component.
		if (!leader) {
			app.store.find('users', parent.data.attributes.leaderUserId).then(function(){
				m.redraw();
			})
		}

		<div class="group-leader-name">{leader ? ("This group's leader is: " + leader.data.attributes.displayName) : ''}</div>
	*/

	const destURL = app.siteSpecifics.fetchFormedURL();
	$('.nav-up').empty().append(
		('<a href="' + destURL + '" class=returntoformed>&lt; Back to Community</a>'));

	const controlsForActionDropdown = this.controlsForActionDropdown().toArray();

    return (
		<div class="holder-marketing-block container" style={{"background-color": this.parent.data.attributes.color}}>

	      <div class="marketing-block">
	     	 <div class="leftside">
					<div class="group-name">{m.trust(this.parent.data.attributes.name)}</div>
					<div class="session-name">{m.trust("Session " + String(this.tag.data.attributes.position+1) + ": " + this.tag.data.attributes.name)}</div>
					<hr class="under-session-name"/>
					<div class="session-description">{m.trust(this.tag.data.attributes.description)}</div>
			 </div>
	      	 <div class="rightside-imageholder" style={{"background-image": "url("+this.tag.data.attributes.backgroundImage+")"}}>
					<a href={this.tag.data.attributes.linkDestination} target='_fromflarumtoformed'>
						 {icon('play-circle', {className: 'play-icon'})}
				    </a>
			 </div>
			 <div class='rightside-shim'>&nbsp;</div>
	      </div>

		  <div class="marketing-block-footer">
					{controlsForActionDropdown.length ? (
						<div class="more-options">
						{
							<Dropdown
								className="ExtensionListItem-controls"
								buttonClassName="Button Button--icon Button--flat"
								menuClassName="Dropdown-menu--right"
								label="More"
								icon="ellipsis-h">
									{controlsForActionDropdown}
							</Dropdown>
						}
						</div> ) : ''
					}
					<div class="session-chooser">
					{
						SelectDropdown.component({
							children: this.list_of_sessions().toArray(),
							buttonClassName: 'Button',
							className: 'App-titleControl'
						})
					}
					</div>
					<div class="num-of-members">
						{this.groupMembershipRoster ? 
						   UserRosterDropdown.component({
								 userList: this.groupMembershipRoster
							 }) : ' '}
					</div>

					{(!(this.isMemberOfGroup) && !(this.loading)) ? (
						<div class="join-or-leave" onclick={this.join.bind(this)}>JOIN</div>
							) : ''}
							{(!(this.isMemberOfGroup) && (this.loading)) ? 
								LoadingIndicator.component({className: 'upper-left-corner-absolute'}) : ''}			

	      </div>

		</div>
    );
  }
}
