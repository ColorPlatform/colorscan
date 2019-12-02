import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Nav, NavLink, Card } from "reactstrap";
import LeaguesList from "./LeaguesListContainer.js";
import ChainStates from "../components/ChainStatesContainer.js";
import { Helmet } from "react-helmet";
import i18n from "meteor/universe:i18n";
import qs from "querystring";
import SideNav, { NavItem, NavIcon, NavText } from "@trendmicro/react-sidenav";
import "@trendmicro/react-sidenav/dist/react-sidenav.css";

const T = i18n.createComponent();

const PriorityEnum = {
//   'moniker': {code: 0, dirKey: 'monikerDir', name: 'moniker'},
    'league': { code: 0, dirKey: 'leagueDir', name: 'league' },  
    'noOfValidators': { code: 1, dirKey: 'noOfValidatorsDir', name: 'noOfValidators' },
//   'votingPower': {code: 2, dirKey: 'votingPowerDir', name: 'votingPower'},
};

const renderToggleIcon = (order) =>
    <i className="material-icons marginleft"> {(order == 1)?'arrow_drop_up':'arrow_drop_down'}</i>;

export default class Leagues extends Component {
  constructor(props) {
    super(props);
    let state = {
    //   monikerDir: 1,
      leagueDir: 1,
      noOfValidatorsDir: 1,
    //   votingPowerDir: -1,
      priority: PriorityEnum.league.code
    }
    // if (props.location.search) {
    //     let queryParams = qs.parse(props.location.search.substring(1));
    //     let sortField = queryParams.sort;
    //     if (sortField && PriorityEnum[sortField]) {
    //         state.priority = PriorityEnum[sortField].code;
    //         if (queryParams.dir && Number(queryParams.dir)) {
    //             state[PriorityEnum[sortField].dirKey] = Number(queryParams.dir) > 0?1:-1;
    //         }
    //     }
    // }
    this.state = state;
  };
  state = {
    selected: "leagues",
    expanded: false
  };

  toggleDir(field, e){
    e.preventDefault();
    if (!PriorityEnum[field])
        return;

    let dirKey = PriorityEnum[field].dirKey;
    let newDir = this.state[dirKey] * -1;
    this.setState({
        [dirKey]: newDir,
        priority: PriorityEnum[field].code
    });
    // this.props.history.replace({
    //     search: qs.stringify({
    //         sort: field,
    //         dir: newDir
    //     })
    // });
};


  onSelect = selected => {
    this.setState({ selected: selected });
  };

  onToggle = expanded => {
    this.setState({ expanded: expanded });
  };

  render() {
    const { expanded, selected } = this.state;
    let title = <T>leagues.leagues</T>;
    let desc = <T>leagues.listOfLeagues</T>;

    return (
      <div>
        <div
          id="validator-list"
          style={{
            marginLeft: expanded ? 200 : 64,
            padding: "15px 20px 0 20px"
          }}
        >
          <Helmet>
            <title>Leagues on Color Explorer | Color</title>
            <meta
              name="description"
              content="Here is a list of Color Leagues"
            />
          </Helmet>
          <Row>
            <Col lg={3} xs={12}>
              <h1 className="d-none d-lg-block">{title}</h1>
            </Col>
            <Col lg={9} xs={12} className="text-lg-right"><ChainStates /></Col>
          </Row>

          <p className="lead">{desc}</p>
          <Row className="validator-list">
            <Col md={12}>
              <Card body>
                <Row className="header text-nowrap">
                  <Col md={1}>
                    &nbsp;
                  </Col>
                  <Col className="d-none d-md-block counter" md={1}>
                    &nbsp;
                  </Col>
                  {/* <Col className="moniker" md={2} onClick={(e) => this.toggleDir('moniker',e)}><i className="material-icons">perm_contact_calendar</i> <span className="d-inline-block d-md-none d-lg-inline-block"><T>validators.moniker</T></span> {renderToggleIcon(this.state.monikerDir)} </Col> */}
                  <Col
                    className="league"
                    md={2}
                    onClick={(e) => this.toggleDir('league',e)}
                  >
                    <i className="material-icons">flag</i>
                    <span className="d-inline-block d-md-none d-lg-inline-block">
                      <T>validators.league</T>
                    </span>
                    {/* {renderToggleIcon(this.state.leagueDir==1)} */}
                  </Col>
                  <Col
                    className="noOfValidators"
                    md={2}
                    onClick={(e) => this.toggleDir('noOfValidators',e)}
                  >
                    <i className="material-icons">perm_contact_calendar</i>
                    <span className="d-inline-block d-md-none d-lg-inline-block">
                      <T>validators.noOfValidators</T>
                    </span>
                    {/* {renderToggleIcon(this.state.noOfValidatorsDir==1)} */}
                  </Col>
                  {/* <Col className="voting-power" md={3} lg={2} onClick={(e) => this.toggleDir('votingPower',e)}><i className="material-icons">power</i> <span className="d-inline-block d-md-none d-lg-inline-block"><T>common.votingPower</T></span> {renderToggleIcon(this.state.votingPowerDir)} </Col> */}
                  <Col
                    md={2}
                    onClick={(e) => this.toggleDir('noOfValidators',e)}
                  >
                    <i className="material-icons">power</i>
                    <span className="d-inline-block d-md-none d-lg-inline-block">
                      <T>common.votingPower</T>
                    </span>
                    {/* {renderToggleIcon(this.state.noOfValidatorsDir==1)} */}
                  </Col>
                </Row>
              </Card>
              {
                <LeaguesList
                //   monikerDir={this.state.monikerDir}
                  leagueDir={this.state.leagueDir}
                  noOfValidatorsDir={this.state.noOfValidatorsDir}
                //   votingPowerDir={this.state.votingPowerDir}
                />
              }
            </Col>
          </Row>
        </div>
        <SideNav
          className="sidenav position-fixed"
          onSelect={this.onSelect}
          onToggle={this.onToggle}
        >
          <SideNav.Toggle />
          <SideNav.Nav selected={selected} defaultSelected="leagues">
            <NavItem
              eventKey="dashboard"
              onClick={e => this.props.history.push("/")}
              title="Dashboard"
            >
              <NavIcon>
                <i
                  className="fa fa-fw fa-home"
                  style={{ fontSize: "1.5em", color: "black" }}
                />
              </NavIcon>
              <NavText>Dashboard</NavText>
            </NavItem>
            <NavItem
              eventKey="validators"
              onClick={e => this.props.history.push("/validators")}
              title="Validators"
            >
              <NavIcon>
                <i
                  className="fa fa-fw fa-spinner"
                  style={{ fontSize: "1.5em", color: "black" }}
                />
              </NavIcon>
              <NavText>Validators</NavText>
            </NavItem>
            <NavItem eventKey="leagues" onClick={ e => this.props.history.push("/leagues") } title="Leagues">
                        <NavIcon>
                            <i className="fa fa-fw fa-flag" style={{ fontSize: '1.5em', color: 'black' }} />
                        </NavIcon>
                        <NavText>
                            Leagues
                        </NavText>
                        
                    </NavItem>
            <NavItem
              eventKey="blocks"
              onClick={e => this.props.history.push("/blocks")}
              title="Blocks"
            >
              <NavIcon>
                <i
                  className="fa fa-fw fa-cube"
                  style={{ fontSize: "1.5em", color: "black" }}
                />
              </NavIcon>
              <NavText>Blocks</NavText>
            </NavItem>
            <NavItem
              eventKey="transactions"
              onClick={e => this.props.history.push("/transactions")}
              title="Transactions"
            >
              <NavIcon>
                <i
                  className="fa fa-fw fa-random"
                  style={{ fontSize: "1.5em", color: "black" }}
                />
              </NavIcon>
              <NavText>Transactions</NavText>
            </NavItem>
            <NavItem
              eventKey="proposals"
              onClick={e => this.props.history.push("/proposals")}
              title="Proposals"
            >
              <NavIcon>
                <i
                  className="fa fa-fw fa-edit"
                  style={{ fontSize: "1.5em", color: "black" }}
                />
              </NavIcon>
              <NavText>Proposals</NavText>
            </NavItem>
            <NavItem eventKey="fundingcycles" onClick={ e => this.props.history.push("/fundingcycles") } title="Funding Cycles">
                        <NavIcon>
                            <i className="fa fa-fw fa-bullseye" style={{ fontSize: '1.5em', color: 'black' }} />
                        </NavIcon>
                        <NavText>
                            Funding Cycles
                        </NavText>
                        
                    </NavItem>
            <NavItem
              eventKey="voting-power-distribution"
              onClick={e =>
                this.props.history.push("/voting-power-distribution")
              }
              title="Voting Power"
            >
              <NavIcon>
                <i
                  className="fa fa-fw fa-chart-bar"
                  style={{ fontSize: "1.5em", color: "black" }}
                />
              </NavIcon>
              <NavText>Voting Power</NavText>
            </NavItem>
          </SideNav.Nav>
        </SideNav>
      </div>
    );
  }
}
