import Component from 'flarum/Component';
import icon from 'flarum/helpers/icon';

export default class TagHero extends Component {



	init() {
    this.tag = this.props.tag;
		this.color = this.tag.color();
		this.parent = app.store.getById('tags', this.tag.data.relationships.parent.data.id);

		// TRY TO OBTAIN INFO ABOUT THE *GROUP* THAT MATCHES THE PARENT TAG
		this.matchingGroup = app.store.getBy('groups', 'slug', this.parent.slug());
		// So now you want to obtain the USER object for the currently logged-in user.
		// In that user object you'll find:
		//   data.relationships.groups.data which is an array.
		//     Each record in that array has a "id" object, string repr of a number.
		// The current user's ID is in:  app.data.session.userId
		this.loggedinUserMembershipList = app.session.user.data.relationships.groups.data;
		this.isMemberOfGroup = this.loggedinUserMembershipList.some(group => (group.id == this.matchingGroup.data.id));
	}



	join () {
		// So: let's try to effect the actual joining of a group from here.
		this.loggedinUserMembershipList.push({type:"groups", id: this.matchingGroup.data.id});
		app.session.user.save({relationships: app.session.user.data.relationships})
		.then(() => {
			console.log("good");
			m.redraw();
		})
		.catch(() => {
			console.log("bad");
			m.redraw();
		});
	};


	
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
				
				{!(this.isMemberOfGroup) ? (
              <div className="button-letme-join-group" onclick={this.join.bind(this)}>JOIN!</div>
 				 ) : ''}

				</div>
    );
  }
}
