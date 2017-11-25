import Component from 'flarum/Component';
import icon from 'flarum/helpers/icon';

export default class TagHero extends Component {
  view() {
    const tag = this.props.tag;
		const color = tag.color();
		const parent = app.store.getById('tags', tag.data.relationships.parent.data.id);
		var leader = app.store.getById('users', parent.data.attributes.leaderUserId);

		// If the leader's full info is not yet fetched from API, start that process and set up the
		// promise to force a redraw of this component.
		if (!leader) {
			app.store.find('users', parent.data.attributes.leaderUserId).then(function(){
				m.redraw();
			})
		}

    return (
	      <table class="marketing-block">
	      <tbody><tr class="marketing-block">
	      <td class="leftside">
	      <div class="group-name">{m.trust(parent.data.attributes.name)}</div>
	      <div class="group-leader-name">{leader ? ("This group's leader is: " + leader.data.attributes.displayName) : ''}</div>
	      <div class="group-summary">{m.trust(parent.data.attributes.description)}</div>
				</td>
	      <td class="rightside">
	        <img src={tag.data.attributes.backgroundImage}></img>
					<a href={tag.data.attributes.linkDestination} target='_fromflarumtoformed'>
						 {icon('play-circle', {className: 'play-icon'})}
				  </a>
				</td>
	      </tr>
	      </tbody></table>
    );
  }
}
