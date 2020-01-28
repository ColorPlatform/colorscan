import React, { Component , useState } from "react";
import { Row, Col, Card, Spinner , Collapse} from "reactstrap";
import { Link } from "react-router-dom";
import i18n from 'meteor/universe:i18n';
import numbro from "numbro";
import posed from "react-pose";

const T = i18n.createComponent();

const Result = posed.div({
  closed: { height: 0 },
  isOpen: { height: "auto" }
});

const ValidatorRow = props => {
  const [isOpen, setIsOpen] = useState(false);
  const [toggleIndex, setToggleIndex]  = useState("");

  const toggle = index => {
    setToggleIndex(index)
    setIsOpen(!isOpen);
  }

 uniqueCount = [...props.validators];
 var  count = {};
 uniqueCount.forEach(function(i) { count[i.league] = (count[i.league]||0) + 1;});
 let sum = 0; 
 return (
    <Card body>
      <Row className="validator-info">
        <Col xs={1} onClick={() => toggle(props.index)}>
          <i className="material-icons iconsize">
            {isOpen
              ? "arrow_right"
              : "arrow_drop_down"}
          </i>
        </Col>
        <Col className="d-none d-md-block counter data" xs={2} md={1}>
          {props.index + 1}
        </Col>
        <Col className="league data" xs={3} md={2}>
            <span className="d-md-inline"><Link to={"/leagues/"+props.validator.league}>League{props.validator.league}</Link></span>
        </Col>
        <Col className="noOfValidators data" xs={2} md={2}>
            {count[props.validator.league]}
        </Col>
        <Col className="data" xs={2} md={2}>
            {
              props.validators.map((type)=>{
                if(type.league===props.validator.league){
                    sum = sum + type.voting_power;
                }
              })
            }
            {sum?numbro(sum).format('0,0'):0} ({sum?numbro(sum/props.totalPower).format('0.00%'):"0.00%"})
           </Col>
        <Col xs={12}>
          {toggleIndex == props.index && isOpen && (
            <Collapse isOpen={isOpen}>{props.nodesDetail(props.validator.league,props.index)}</Collapse>
          )}
        </Col>
      </Row>
    </Card>
  );
};

export default class LeaguesList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      validators: []
    };
  }

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
                address={validator.address}
                totalPower={this.props.chainStatus.activeVotingPower}
                inactive={this.props.inactive}
                validators={this.props.validators}
                nodesDetail={this.nodesDetail}
              />
            );
          }),
        });
      } else {
        this.setState({
          validators: ""
        });
      }
    }
  };
  nodesDetail = (league) => {
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
