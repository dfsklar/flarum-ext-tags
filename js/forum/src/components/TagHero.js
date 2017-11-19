import Component from 'flarum/Component';

export default class TagHero extends Component {
  view() {
    const tag = this.props.tag;
		const color = tag.color();
		const parent = app.store.getById('tags', tag.data.relationships.parent.data.id);
		const leader = app.store.getById('users', parent.data.attributes.leaderUserId);

      return (
	      <table class="marketing-block">
	      <tbody><tr class="marketing-block">
	      <td class="leftside">
	      <div class="group-name">{parent.data.attributes.name}</div>
	      <div class="group-leader-name">{parent.data.attributes.leaderUserId}</div>
	      <div class="group-leader-name">{leader.data.attributes.displayName}</div>
	      <div class="group-summary">{parent.data.attributes.description}</div>
				</td>
	      <td class="rightside">
	        <img src={tag.data.attributes.backgroundImage}></img>
					<div class='commentary'>Coming soon: this will be clickable! </div>
				</td>
	      </tr>
	      </tbody></table>
    );
  }
}
