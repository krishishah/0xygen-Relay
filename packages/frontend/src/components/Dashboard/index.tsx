import * as React from 'react';
import { Button, Dropdown, Menu, MenuItemProps } from 'semantic-ui-react';

export type UserWorflow = 'Maker' | 'Taker';

export interface DashboardProps {
    activeWorkflow: UserWorflow;
    onChangeWorkflow: (event: React.MouseEvent<HTMLAnchorElement>, data: MenuItemProps) => void;
}

export class Dashboard extends React.Component<DashboardProps> {

    constructor(props: DashboardProps) {
        super(props);
    }

    render() {
        const activeWorkflow = this.props.activeWorkflow;

        return (
        <div style={{ marginBottom: '4em' }}>
            <Menu borderless={true} size="large" fixed="top" color="blue">
            <Menu.Item primary="true" icon="lab" name="OXYGEN DEX"/>
            
            <Menu.Menu position="right">
                <Menu.Item 
                    name="Order Taker" 
                    active={activeWorkflow === 'Taker'} 
                    onClick={this.props.onChangeWorkflow} 
                />
                <Menu.Item 
                    name="Order Maker" 
                    active={activeWorkflow === 'Maker'} 
                    onClick={this.props.onChangeWorkflow} 
                />
            </Menu.Menu>
            </Menu>
        </div>
        );
    }
}