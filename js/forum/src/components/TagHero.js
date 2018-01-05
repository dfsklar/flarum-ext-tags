import Component from 'flarum/Component';
import icon from 'flarum/helpers/icon';
import LoadingIndicator from 'flarum/components/LoadingIndicator';


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


	init() {
		// We want to force a reload of this user's complete info in case its group-membership list has changed.
		this.loading = true;
	    app.store.find('users', app.session.user.id())
			.then(this.refreshGroupMembershipInfo.bind(this));

    	this.tag = this.props.tag;
		this.color = this.tag.color();
		this.parent = app.store.getById('tags', this.tag.data.relationships.parent.data.id);

		// TRY TO OBTAIN INFO ABOUT THE *GROUP* THAT MATCHES THE PARENT TAG
		this.matchingGroup = app.store.getBy('groups', 'slug', this.parent.slug());
		this.isMemberOfGroup = false;  // Meaning: we do not know yet, but a fresh reload is already taking place.
	}


	_join() {
		this.loggedinUserMembershipList = app.session.user.data.relationships.groups.data;		
		this.loggedinUserMembershipList.push({type:"groups", id: this.matchingGroup.data.id});
		app.session.user.save({relationships: app.session.user.data.relationships})
		.then(() => {
			this.isMemberOfGroup = true;
			this.loading = false;
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

    return (
		<div class="holder-marketing-block container" style={{"background-color": this.parent.data.attributes.color}}>

	      <table class="marketing-block">
	      <tbody><tr class="marketing-block">
	      <td class="leftside">
					<div class="group-name">{m.trust(this.parent.data.attributes.name)}</div>
					<div class="session-name">{m.trust(this.tag.data.attributes.name)}</div>
					<div class="session-description">{m.trust(this.tag.data.attributes.description)}</div>
				</td>
	      <td class="rightside-imageholder" style={{"background-image": "url("+this.tag.data.attributes.backgroundImage+")"}}>
					<a href={this.tag.data.attributes.linkDestination} target='_fromflarumtoformed'>
						 {icon('play-circle', {className: 'play-icon'})}
				  </a>
				</td>
	      </tr>
	      </tbody></table>

  		  {(!(this.isMemberOfGroup) && !(this.loading)) ? (
              <div className="button-letme-join-group" onclick={this.join.bind(this)}>JOIN!</div>
 				 ) : ''}
				{(!(this.isMemberOfGroup) && (this.loading)) ? 
					LoadingIndicator.component({className: 'upper-left-corner-absolute'}) : ''}				
			  
  		  {((this.isMemberOfGroup) && !(this.loading)) ? (
              <div className="button-letme-join-group" onclick={this.unjoin.bind(this)}>Leave!</div>
 				 ) : ''}
				{((this.isMemberOfGroup) && (this.loading)) ? 
					LoadingIndicator.component({className: 'upper-left-corner-absolute'}) : ''}				


		</div>
    );
  }
}
