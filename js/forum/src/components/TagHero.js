import Component from 'flarum/Component';
import icon from 'flarum/helpers/icon';

export default class TagHero extends Component {
  view() {
    const tag = this.props.tag;
		const color = tag.color();
		const parent = app.store.getById('tags', tag.data.relationships.parent.data.id);

		// TRY TO OBTAIN INFO ABOUT THE *GROUP* THAT MATCHES THE PARENT TAG
		// DFSKLAR Friday 10:03pm

		const matchingGroup = app.store.getBy('groups', 'slug', parent.slug());
		console.log(matchingGroup);

		// So now you want to obtain the USER object for the currentyly logged in user.
		// In that user object you'll find:
		//   data.relationships.groups.data which is an array.
		//     Each record in that array has a "id" object, string repr of a number.
		// The current user's ID is in:  app.data.session.userId
		const loggedinUserMembershipList = app.session.user.data.relationships.groups.data;

		const isMemberOfGroup = loggedinUserMembershipList.some(group => (group.id == matchingGroup.data.id));
    


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
			  <div class="holder-marketing-block container" style={{"background-color": parent.data.attributes.color}}>
	      <table class="marketing-block">
	      <tbody><tr class="marketing-block">
	      <td class="leftside">
					<div class="group-name">{m.trust(parent.data.attributes.name)}</div>
					<div class="session-name">{m.trust(tag.data.attributes.name)}</div>
					<div class="session-description">{m.trust(tag.data.attributes.description)}</div>
				</td>
	      <td class="rightside-imageholder" style={{"background-image": "url("+tag.data.attributes.backgroundImage+")"}}>
					<a href={tag.data.attributes.linkDestination} target='_fromflarumtoformed'>
						 {icon('play-circle', {className: 'play-icon'})}
				  </a>
				</td>
	      </tr>
	      </tbody></table></div>
    );
  }
}
