import * as React from 'react';
import { Button, Dropdown, Menu } from 'semantic-ui-react';

export class Dashboard extends React.Component {
  state = { activeItem: 'home' };

  handleItemClick = (e, { name }) => this.setState({ activeItem: name });

  render() {
    const { activeItem } = this.state;

    return (
      <div style={{ padding: '1em' }}>
        <Menu borderless={true} size="large" fixed="top" color="blue">
          <Menu.Item primary="true" icon="lab" name="OXYGEN DEX"/>
          
          <Menu.Menu position="right">
            <Menu.Item name="Simple" active={activeItem === 'home'} onClick={this.handleItemClick} />
            <Menu.Item name="Expert" active={activeItem === 'messages'} onClick={this.handleItemClick} />
          </Menu.Menu>
        </Menu>
      </div>
    );
  }
}