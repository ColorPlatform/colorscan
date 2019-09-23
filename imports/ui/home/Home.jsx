import React, { Component } from 'react';
import { Row, Col } from 'reactstrap';
import ChainStatus from './ChainStatusContainer.js';
import Consensus from './ConsensusContainer.js';
import TopValidators from './TopValidatorsContainer.js';
// import Chart from './ChartContainer.js';
import ChainStates from '../components/ChainStatesContainer.js'
import { Helmet } from "react-helmet";
import SideNav, { NavItem, NavIcon, NavText} from '@trendmicro/react-sidenav';
import '@trendmicro/react-sidenav/dist/react-sidenav.css';
import PieChart from './PieChart.js';

export default class Home extends Component{
    constructor(props){
        super(props);
        this.state = {
            chainStopped: false            
        }
    };
    state = {
        selected: 'dashboard',
        expanded: false
    };

    componentDidUpdate(prevProps){
        if (prevProps.consensus != this.props.consensus){
            if (this.props.consensus.latestBlockTime){
                let lastSync = moment(this.props.consensus.latestBlockTime);
                let current = moment();
                let diff = current.diff(lastSync);
                if (diff > 60000){
                    this.setState({
                        chainStopped:true
                    })
                }
                else{
                    this.setState({
                        chainStopped:false
                    })
                }
            }
        }
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
            <div id="home" style={{
                        marginLeft: expanded ? 200 : 64,
                        padding: '15px 20px 0 20px'
                    }}>
            <Helmet>
                <title>Color | Explorer</title>
                <meta name="description" content="Color is a decentralized network of independent parallel blockchains, each powered by BFT consensus algorithms like Prism consensus." />
            </Helmet>
            <Row>
                <Col md={12} xs={12}><h1 className="d-none d-lg-block">{Meteor.settings.public.chainName}</h1></Col>
                {/* <Col md={9} xs={12} className="text-md-right"><ChainStates /></Col> */}
            </Row>
            {(this.state.chainStopped)?<Card body inverse color="danger">
                            <span><T _purify={false} time={moment(this.props.consensus.latestBlockTime).fromNow(true)}>chainStatus.stopWarning</T></span>             
                        </Card>:''}
            <Row>
                <Col md={6}>
                    <ChainStatus />
                </Col>
                <Col md={6}>
                    <br></br>
                    <Consensus />
                </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <TopValidators />
                </Col>
                <Col md={6}>
                    <PieChart />
                </Col>
            </Row>

            </div>
            <SideNav className="sidenav position-fixed" onSelect={this.onSelect} onToggle={this.onToggle}>
                <SideNav.Toggle />
                <SideNav.Nav selected={selected} defaultSelected="dashboard">
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