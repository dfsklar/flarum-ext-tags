import Component from 'flarum/Component';
import icon from 'flarum/helpers/icon';

export default class TagHero extends Component {
  view() {
    const tag = this.props.tag;
		const color = tag.color();
		const parent = app.store.getById('tags', tag.data.relationships.parent.data.id);

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
