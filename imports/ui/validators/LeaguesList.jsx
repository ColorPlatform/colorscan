import React, { Component, useState } from "react";
import { Badge, Progress, Row, Col, Card, Spinner } from "reactstrap";
import { Link } from "react-router-dom";
import moment from "moment";
import { Meteor } from "meteor/meteor";
import Validator from "./Validator.jsx";
import i18n from 'meteor/universe:i18n';
import numbro from "numbro";
import posed from "react-pose";
import Avatar from "../components/Avatar.jsx";

const T = i18n.createComponent();

const Result = posed.div({
  closed: { height: 0 },
  isOpen: { height: "auto" }
});

const ValidatorRow = props => {
 uniqueCount = [...props.validators];
 var  count = {};
 uniqueCount.forEach(function(i) { count[i.league] = (count[i.league]||0) + 1;});
  return (
    <Card body>
      <Row className="validator-info">
        <Col className="d-none d-md-block counter data" xs={2} md={1}>
          {props.index + 1}
        </Col>
        <Col className="league data" xs={3} md={2}>
            <span className="d-md-inline">League{props.validator.league}</span>
        </Col>
        <Col className="league data" xs={2} md={2}>
            {count[props.validator.league]}
        </Col>
        <Col xs={1} onClick={() => props.toggle(props.index)}>
          <i className="material-icons">
            {props.index === props.toggleIndex && props.isOpen
              ? "arrow_drop_down"
              : "arrow_left"}
          </i>
        </Col>
        <Col xs={12}>
          {props.index === props.toggleIndex && props.isOpen
            ? props.nodesDetail(props.validator.league,props.index)
            : null}
        </Col>
      </Row>
    </Card>
  );
};

export default class LeaguesList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    //   orderDir: -1,
      validators: [],
      toggleIndex: ""
    };

    // if (Meteor.isServer){

    //     if (this.props.validators.length > 0 && this.props.chainStatus){
    //         this.state = {
    //             validators: this.props.validators.map((validator, i) => {
    //                 return <ValidatorRow
    //                     key={validator.address}
    //                     index={i}
    //                     nodesDetail={this.nodesDetail}
    //                     isOpen={this.state.open}
    //                     validator={validator}
    //                     // handleClick={handleClick}
    //                     address={validator.address}
    //                     totalPower={this.props.chainStatus.activeVotingPower}
    //                     inactive={this.props.inactive}
    //                     validators={this.state.validators}
    //                 />
    //             })
    //         }
    //     }
    // }
    // else{
    //     this.state = {
    //         validators: ""
    //     }
    // }
  }

//   toggleDir(e) {
//     e.preventDefault();
//     this.setState({
//       orderDir: this.state.orderDir * -1
//     });
//   }
  toggle = index => {
    this.setState({
      isOpen: !this.state.isOpen,
      toggleIndex: index
    });
  };
  componentDidUpdate(prevProps) {
    if (this.props.validators != prevProps.validators) {
        const newArray = [];
        if (this.props.validators.length > 0 && this.props.chainStatus) {
       this.props.validators.forEach(obj => {
            if (!newArray.some(o => o.league == obj.league)) {
              newArray.push({ ...obj })
            }
      
          });}
      if (this.props.validators.length > 0 && this.props.chainStatus) {
        this.setState({
          validators: newArray.map((validator, i) => {
            return (
              <ValidatorRow
                key={validator.address}
                index={i}
                validator={validator}
                isOpen={this.state.isOpen}
                address={validator.address}
                totalPower={this.props.chainStatus.activeVotingPower}
                inactive={this.props.inactive}
                validators={this.props.validators}
                nodesDetail={this.nodesDetail}
                toggle={this.toggle}
                toggleIndex={this.state.toggleIndex}
              />
            );
          })
        });
      } else {
        this.setState({
          validators: ""
        });
      }
    }
  }

  nodesDetail = (league,index) => {
    var  count = {};
    return (
      <Result className="tally-result-detail">
        <Card className="tally-result-table">
          <Card body>
            <Row className="header text-nowrap">
              <Col className="d-none d-md-block counter" md={1}>
                &nbsp;
              </Col>
              <Col className="individualleague" md={4}>
                <i className="material-icons">perm_contact_calendar</i>
                <span className="d-inline-block d-md-none d-lg-inline-block">
                  <T>validators.moniker</T>
                </span>
              </Col>
              <Col
                className="individualleague"
                md={4}
                // onClick={e => this.toggleDir(e)}
              >
                <i className="material-icons">power</i>
                <span className="d-inline-block d-md-none d-lg-inline-block">
                  <T>common.votingPower</T>
                </span>
                <i className="material-icons">
                  {/* {this.state.orderDir == 1
                    ? "arrow_drop_up"
                    : "arrow_drop_down"} */}
                </i>
              </Col>
            </Row>
          </Card>

          {this.props.validators.map((item, i) =>
            item.league == league ? (
                uniqueCount = [...item.league],
                uniqueCount.forEach(function(i) { count[i] = (count[i]||0) + 1}),
              <Card body key={i}>
                <Row className="voter-info">
                  <Col className="d-none d-md-block counter data" md={1}>
                    {count[item.league]}
                  </Col>
                  <Col className="moniker data" md={4}>
                    <span className="address overflow-auto d-inline"><Link to={"/validator/"+item.operator_address}>{item.description.moniker}</Link></span>
                  </Col>
                  <Col className="voting-power" md={4}>
                    <i className="material-icons d-md-none">power</i>
                    {item.voting_power?numbro(item.voting_power).format('0,0'):0} ({item.voting_power?numbro(item.voting_power/this.props.chainStatus.activeVotingPower).format('0.00%'):"0.00%"})
                  </Col>
                  <Col md={3}></Col>
                </Row>
              </Card>
            ) : ( null
            )
          )}
        </Card>
    </Result>
    );
  };

  render() {
    if (this.props.loading) {
      return <Spinner type="grow" color="primary" />;
    } else {
      return this.state.validators;
    }
  }
}
