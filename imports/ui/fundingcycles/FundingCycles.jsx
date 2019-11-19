import React, { Component } from 'react';
import { Badge, Row, Col } from 'reactstrap';
import { Route, Switch } from 'react-router-dom';
import List from './ListContainer.js';
import ChainStates from '../components/ChainStatesContainer.js'
import { Helmet } from 'react-helmet';
import i18n from 'meteor/universe:i18n';
import SideNav, { NavItem, NavIcon, NavText} from '@trendmicro/react-sidenav';
import '@trendmicro/react-sidenav/dist/react-sidenav.css';

const T = i18n.createComponent();

const FundingCyclesList = () => {
    return <div>
        <Row>
            <Col md={12}>
                <List />
            </Col>
        </Row>
    </div>
}
export default class FundingCycles extends Component{
    constructor(props){
        super(props);
    };
    state = {
        selected: 'fundingcycles',
        expanded: false
    };

    onSelect = (selected) => {
        this.setState({ selected: selected });
    };

    onToggle = (expanded) => {
        this.setState({ expanded: expanded });
    };

    render() {
        const { expanded, selected } = this.state;
        return (
        <div>
            <div id="fundingcycles" style={{
                            marginLeft: expanded ? 200 : 64,
                            padding: '15px 20px 0 20px'
                        }}>
            <Helmet>
                <title>Funding Cycles on Color Explorer | Color</title>
                <meta name="description" content="Color Explorer incorporates on-chain governance. Come to see how on-chain governance can be achieved on Color Explorer." />
            </Helmet>
            <Row>
                <Col md={3} xs={12}><h1 className="d-none d-lg-block"><T>fundingcycles.fundingcycles</T></h1></Col>
                <Col md={9} xs={12} className="text-md-right"><ChainStates /></Col>
            </Row>
            <Switch>
                <Route exact path="/fundingcycles" component={FundingCyclesList} />
            </Switch>
        </div>
        <SideNav className="sidenav position-fixed" onSelect={this.onSelect} onToggle={this.onToggle}>
                <SideNav.Toggle />
                <SideNav.Nav selected={selected} defaultSelected="fundingcycles">
                    <NavItem eventKey="dashboard" onClick={ e => this.props.history.push("/") } title="Dashboard">
                        <NavIcon>
                            <i className="fa fa-fw fa-home" style={{ fontSize: '1.5em', color: 'black' }} />
                        </NavIcon>
                        <NavText>
                            Dashboard
                        </NavText>
                        
                    </NavItem>
                    <NavItem eventKey="validators" onClick={ e => this.props.history.push("/validators") } title="Validators">
                        <NavIcon>
                            <i className="fa fa-fw fa-spinner" style={{ fontSize: '1.5em', color: 'black' }} />
                        </NavIcon>
                        <NavText>
                            Validators
                        </NavText>
                        
                    </NavItem>
                    <NavItem eventKey="leagues" onClick={ e => this.props.history.push("/leagues") } title="Leagues">
                        <NavIcon>
                            <i className="fa fa-fw fa-flag" style={{ fontSize: '1.5em', color: 'black' }} />
                        </NavIcon>
                        <NavText>
                            Leagues
                        </NavText>
                        
                    </NavItem>
                    <NavItem eventKey="blocks" onClick={ e => this.props.history.push("/blocks") } title="Blocks">
                        <NavIcon>
                            <i className="fa fa-fw fa-cube" style={{ fontSize: '1.5em', color: 'black' }} />
                        </NavIcon>
                        <NavText>
                            Blocks
                        </NavText>
                        
                    </NavItem>
                    <NavItem eventKey="transactions" onClick={ e => this.props.history.push("/transactions") } title="Transactions">
                        <NavIcon>
                            <i className="fa fa-fw fa-random" style={{ fontSize: '1.5em', color: 'black' }} />
                        </NavIcon>
                        <NavText>
                            Transactions
                        </NavText>
                        
                    </NavItem>
                    <NavItem eventKey="proposals" onClick={ e => this.props.history.push("/proposals") } title="Proposals">
                        <NavIcon>
                            <i className="fa fa-fw fa-edit" style={{ fontSize: '1.5em', color: 'black' }} />
                        </NavIcon>
                        <NavText>
                            Proposals
                        </NavText>
                        
                    </NavItem>
                    <NavItem eventKey="fundingcycles" onClick={ e => this.props.history.push("/fundingcycles") } title="Funding Cycles">
                        <NavIcon>
                            <i className="fa fa-fw fa-bullseye" style={{ fontSize: '1.5em', color: 'black' }} />
                        </NavIcon>
                        <NavText>
                            Funding Cycles
                        </NavText>
                        
                    </NavItem>
                    <NavItem eventKey="voting-power-distribution" onClick={ e => this.props.history.push("/voting-power-distribution") } title="Voting Power">
                        <NavIcon>
                            <i className="fa fa-fw fa-chart-bar" style={{ fontSize: '1.5em', color: 'black'}} />
                        </NavIcon>
                        <NavText>
                            Voting Power
                        </NavText>
                    </NavItem>
                </SideNav.Nav>
            </SideNav>
            </div>
            )
    }

}