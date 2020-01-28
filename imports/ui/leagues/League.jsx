import React, { Component } from "react";
import { Link, Switch, Route } from "react-router-dom";
import numbro from "numbro";
import moment from "moment";
import { Markdown } from "react-showdown";
import Block from "../components/Block.jsx";
import Avatar from "../components/Avatar.jsx";
import PowerHistory from "../components/PowerHistory.jsx";
import {
  Badge,
  Row,
  Col,
  Card,
  CardBody,
  Spinner,
  Nav,
  NavItem,
  NavLink
} from "reactstrap";
import KeybaseCheck from "../components/KeybaseCheck.jsx";
import { Helmet } from "react-helmet";
import i18n from "meteor/universe:i18n";

const T = i18n.createComponent();

addhttp = url => {
  if (!/^(f|ht)tps?:\/\//i.test(url)) {
    url = "http://" + url;
  }
  return url;
};

export default class League extends Component {
  constructor(props) {
    let showdown = require("showdown");
    showdown.setFlavor("github");
    super(props);
    this.state = {
      identity: "",
      records: "",
      history: "",
      updateTime: "",
      validators: []
    };
  }

  componentDidUpdate(prevState) {
    if (this.props.validator != prevState.validator) {
      // if (this.props.validator.description.identity != prevState.validator.description.identity){
      if (
        this.props.validator.description &&
        this.props.validator.description != prevState.validator.description
      ) {
        // console.log(prevState.validator.description);
        if (this.state.identity != this.props.validator.description.identity) {
          this.setState({
            identity: this.props.validator.description.identity
          });
        }
      }

      if (this.props.validator.commission) {
        if (
          this.props.validator.commission.update_time ==
          Meteor.settings.public.genesisTime
        ) {
          this.setState({
            updateTime: "Never changed"
          });
        } else {
          Meteor.call(
            "Validators.findCreateValidatorTime",
            this.props.validator.delegator_address,
            (error, result) => {
              if (error) {
                console.warn(error);
              } else {
                if (result) {
                  if (result == this.props.validator.commission.update_time) {
                    this.setState({
                      updateTime: "Never changed"
                    });
                  } else {
                    this.setState({
                      updateTime:
                        "Updated " +
                        moment(
                          this.props.validator.commission.update_time
                        ).fromNow()
                    });
                  }
                } else {
                  this.setState({
                    updateTime:
                      "Updated " +
                      moment(
                        this.props.validator.commission.update_time
                      ).fromNow()
                  });
                }
              }
            }
          );
        }
      }

      if (this.props.validatorExist) {
        if (this.props.validator.history().length > 0) {
          this.setState({
            history: this.props.validator.history().map((history, i) => {
              return (
                <PowerHistory
                  key={i}
                  type={history.type}
                  prevVotingPower={history.prev_voting_power}
                  votingPower={history.voting_power}
                  time={history.block_time}
                  height={history.height}
                  address={this.props.validator.operator_address}
                />
              );
            })
          });
        }
      }
    }

    if (this.props.records != prevState.records) {
      if (this.props.records.length > 0) {
        this.setState({
          records: this.props.records.map((record, i) => {
            return (
              <Block key={i} exists={record.exists} height={record.height} />
            );
          })
        });
      }
    }
  }

  render() {
    if (this.props.loading) {
      return <Spinner type="grow" color="primary" />;
    } else {
      if (this.props.validatorsExist) {
        let league = this.props.match.params.address;
        let uniqueCount = [...this.props.validators];
        var count = {};
        return (
            <div
            id="validator-list">
            <Helmet>
              <title>League{league} | ColorScan</title>
              <meta name="description" content="League {league} on ColorScan" />
            </Helmet>
            <Col xs={12}>
              <Link to="/validators" className="btn btn-link">
                <i className="fas fa-caret-left"></i> <T>common.backToList</T>
              </Link>
            </Col>
            <Row className="validator-list">
            <Col md={12}>
            <Card body>
                <Row className="header text-nowrap">
                    <Col className="d-none d-md-block counter" md={1}>
                      &nbsp;
                    </Col>
                    <Col md={4}>
                      <i className="material-icons">perm_contact_calendar</i>
                      <span className="d-inline-block d-md-none d-lg-inline-block">
                        <T>validators.moniker</T>
                      </span>
                    </Col>
                    <Col
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
                </Col>
                </Row>
            {Object.values(this.props.validators).map((validator, index) => {
              if (validator.league === this.props.match.params.address) {
                return (
                    validator.league == league ? (
                        uniqueCount = [...validator.league],
                        uniqueCount.forEach(function(index) { count[index] = (count[index]||0) + 1}),
                    <div
                        id="validator-list">
                    <Row className="validator-list">
                    <Col md={12}>
                    <Card body key={index}>
                      <Row className="validator-info">
                        <Col className="d-none d-md-block counter data" md={1}>
                        {count[validator.league]}
                        </Col>
                        <Col className="moniker data" md={4}>
                          <span className="address overflow-auto d-inline">
                            <Link
                              to={"/validator/" + validator.operator_address}
                            >
                              {validator.description.moniker}
                            </Link>
                          </span>
                        </Col>
                        <Col className="voting-power" md={4}>
                          <i className="material-icons d-md-none">power</i>
                          {validator.voting_power
                            ? numbro(validator.voting_power).format("0,0")
                            : 0}{" "}
                          (
                          {validator.voting_power
                            ? numbro(
                                validator.voting_power /
                                  this.props.chainStatus.activeVotingPower
                              ).format("0.00%")
                            : "0.00%"}
                          )
                        </Col>
                        <Col md={3}></Col>
                      </Row>
                    </Card>
                    </Col>
                    </Row>
                    </div>
                    ) : ( null
                        )
                );
              } else {
                return null;
              }
            })}
          </div>
        );
      } else {
        return (
          <div>
            <T>validators.validatorNotExists</T>
          </div>
        );
      }
    }
  }
}
