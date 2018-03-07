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
		this.arrayOnlyWithLeader = [ { type: "users", id: this.groupLeaderUserID}];
		this.groupMembershipRoster = r.data.relationships.users.data;  // [ {type:"users", id:"32"}, ... ]
		this.groupWannabeRoster = r.data.relationships.wannabeusers.data;
		m.redraw();
	}


	init() {

		this.ENABLE_INSTANT_JOIN = true;

		// We want to force a reload of this user's complete info in case its group-membership list has changed.
		this.loading = true;
		this.groupWannabeRoster = [];
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
			
		// Am "I" the leader of this group?
		this.groupLeaderUserID = this.parent.data.attributes.leaderUserId;
		this.yesIAmTheLeaderOfThisGroup =  (String(this.groupLeaderUserID) == String(app.session.user.data.id));

		app.store.find('groups', this.matchingGroup.data.id)
			.then(this.recordGroupRoster.bind(this));

		// Extract the title and session number
		function hideSpecialGroupFlag(grouptitle) {
			return (grouptitle[0] == '\x07') ? grouptitle.substr(1) : grouptitle;
		}
		var ignoreMeJustNeededToRunThisMethod = this.list_of_sessions();
		this.title = hideSpecialGroupFlag(this.parent.data.attributes.name);
		this.sessionNumber = this.tag.sessionNumber;
	}


	_join() {
		this.loggedinUserMembershipList = 
			this.ENABLE_INSTANT_JOIN ? 
			app.session.user.data.relationships.groups.data :		
			app.session.user.data.relationships.grouprequests.data;		
		this.loggedinUserMembershipList.push({type:"groups", id: this.matchingGroup.data.id});
		app.session.user.save({relationships: app.session.user.data.relationships})
		.then(() => {
			this.isMemberOfGroup = this.ENABLE_INSTANT_JOIN;
			this.hasRequestedMembership =  ( ! (this.ENABLE_INSTANT_JOIN) );
			this.loading = false;
			if (!(this.ENABLE_INSTANT_JOIN))
				alert("Thanks for your interest!  You will receive email when your membership has been approved.");
			else
				this.groupMembershipRoster.push({type: "users", id: String(app.session.user.id())});
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
			this.init();
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
	  let hidden = (!this.yesIAmTheLeaderOfThisGroup) && tag.data.attributes.isHidden;

      if (!active && currentTag) {
        active = (currentTag.parent() === tag);
      }

	  // CAREFUL: similar logic is found in addTagList.js !!!!
      if (tag.isChild() && (tag.parent() === currentPrimaryTag) && (!hidden)) {
		tag.sessionNumber = fullArray.length-indexSeq;
        items.add('tag' + tag.id(), TagLinkButton.component({
		  label: 'Session ' + String(tag.sessionNumber) + " of " + String(fullArray.length),
		  idx: fullArray.length - indexSeq,
          tag: tag, 
          params: this.params, 
          active: active}), -10);
      }
    };


	// DFSKLARD:  THE SESSION DROPDOWN IN THE FOOTER OF THE TAGHERO !!!!!!
    // DFSKLARD: my own attempts at a custom list of secondary tags to provide a list of sessions.
	// I ONLY SHOW THE subtags OF THE active primary tag.
	// I do NOT hide the marked-as-hidden ones because this is currently used only for the admin-only
	// session-reordering UI.
	let yesIAmTheLeaderOfThisGroup = this.yesIAmTheLeaderOfThisGroup;
	this.session_tags = 
		tags
		.filter((tag,idx) => 
			(tag.position() !== null) 
			&&
			tag.isChild()
			&&
			(tag.parent() === currentPrimaryTag))
		.sort((a,b) => (a.position() - b.position()))
		.filter((tag,idx) => 
			( ( ! ((!yesIAmTheLeaderOfThisGroup) && tag.data.attributes.isHidden) ) || (idx == 0) ))
		.reverse();
	this.session_tags.forEach(addTag.bind(this));
 
	return items;
  }

  

  launchSessionOrderingEditor() {
	app.modal.show(new ReorderTagsModal({tags: this.session_tags, current_tag: this.tag}));
  }

  refreshAfterMembershipRosterChange() {
	this.init();
  }

  launchWannabeApprover() {
	app.modal.show(new ApproveWannabeMembersModal(
		{
			onHide: this.refreshAfterMembershipRosterChange.bind(this),
			group: this.matchingGroup,
			users: this.matchingGroup.data.relationships.wannabeusers.data.map(
				function (x) {
					return app.store.getById('users', x.id);
				}
			)
		}));
  }

  deleteSessionAfterConfirm() {
	  // If this is the ONLY session, don't even allow it.
	  const children = app.store.all('tags').filter(child => child.parent() === this.parent);
	  if (children.length < 2) {
		  alert("You cannot delete this session because it is the only session in this community group.");
	  }
	  else {
		if (confirm("Are you sure you want to DELETE session #"
					+ this.sessionNumber + " ("
					+ this.title + ")?")
			) 
		{
			const target = app.route.tag(this.parent);
			this.tag.delete().then(() => {
				m.route(target, null, {replace: true});
			});
		}
	}
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

		items.add('delete', Button.component({
			children: [ 'Delete this session' ],
			onclick: this.deleteSessionAfterConfirm.bind(this)
		}));

		items.add('reorder', Button.component({
			children: [ 'Reorder sessions' ],
			onclick: this.launchSessionOrderingEditor.bind(this)
		}));

		if ( ! (this.ENABLE_INSTANT_JOIN) ) {
			const numWannabes = ( this.groupWannabeRoster.length );
			items.add('approve', Button.component({
				disabled: (numWannabes == 0),
				children: [
					<span className='label'>
						Manage membership requests
						<span className='count'>
						{numWannabes}
						</span>
					</span>
				],
				onclick: this.launchWannabeApprover.bind(this)
			}));
		}
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


  fix_destination_link(url) {
	  const correctDomain = 'https://formed.org';
	  return url.replace('https://alpha.formed.org',correctDomain).replace('http://sklardev.formed.org:3000',correctDomain);
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
					<div class="group-name">{m.trust(this.title)}</div>
					<div class="session-name">{m.trust("Session " + String(this.sessionNumber) + ": " + this.tag.data.attributes.name)}</div>
					<hr class="under-session-name"/>
					<div class="session-description">{m.trust(this.tag.data.attributes.description)}</div>
			 </div>
	      	 <div class="rightside-imageholder" style={{"background-image": "url("+this.tag.data.attributes.backgroundImage+")"}}>
					<a href={this.fix_destination_link(this.tag.data.attributes.linkDestination)} target='_fromflarumtoformed'>
						 {icon('play-circle', {className: 'play-icon'})}
				    </a>
			 </div>
			 <div class='rightside-shim'>&nbsp;</div>
	      </div>

		  {(this.yesIAmTheLeaderOfThisGroup && this.groupWannabeRoster.length > 0) ? 
		  (
			<div class='please-handle-roster'>
			   Membership requests are awaiting your consideration.  Please use the "...More" menu to handle.
			</div>
		  ) : ''
		  }

		  <div class="marketing-block-footer">
					{this.tag.data.attributes.isHidden ? 
					  (
						<span className='this-tag-is-hidden'>Currently HIDDEN</span>
					  ) : ''
					}
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
								 userList: this.arrayOnlyWithLeader.concat(this.groupMembershipRoster)
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
