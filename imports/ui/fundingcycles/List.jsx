import React, { Component } from 'react';
import moment from 'moment';
import { Table, Spinner, Col, Row, Card, UncontrolledCollapse, CardBody } from 'reactstrap';
import i18n from 'meteor/universe:i18n';
import { Link } from 'react-router-dom';

const T = i18n.createComponent();

const ProposalRow = (props) => {
  return (
  <Card body>
    <Row className="validator-info">
      <Col className="d-md-block counter data" xs={12} md={1}>
      <i className="fas fa-hashtag d-lg-none"></i>
      {props.fundingCycle.cycle_id}
      </Col>
      <Col className="league data" xs={12} md={2}>
      <i className="fas fa-clock d-lg-none"></i>
      {moment.utc(props.fundingCycle.cycle_start_time).format("D MMM YYYY, h:mm:ssa")}
      </Col>
      <Col className="league data" xs={12} md={2}>
      <i className="fas fa-clock d-lg-none"></i>
      {moment.utc(props.fundingCycle.cycle_end_time).format("D MMM YYYY, h:mm:ssa")}
      </Col>
      <Col className="league data" xs={12} md={2}>
      <i className="fas fa-box-open d-lg-none"></i>
      {props.fundingCycle.funded_proposals !== null ? props.fundingCycle.funded_proposals.length : 0}
      </Col>
      {/* <Col xs={1} onClick={() => props.toggle(props.index)} id="toggler">
        <i className="material-icons">
            {props.index === props.toggleIndex && props.isOpen
              ? "arrow_drop_down"
              : "arrow_left"}
          </i>
      </Col>
      <Col xs={12}>
      
      {props.fundingCycle.funded_proposals !== null ? (
        props.fundingCycle.funded_proposals.map((type,key)=>{
          return (
            <React.Fragment>
            {props.index === props.toggleIndex && props.isOpen
              ? <UncontrolledCollapse toggler="#toggler">
                {
                  props.proposals.map((proposal,key)=>{
                    // console.log(proposal.proposalId,"==========")
                    // console.log(props.fundingCycle.funded_proposals,"++++++++++")
                    // if(proposal.proposalId == props.fundingCycle.funded_proposals){
                      return <Card key={key} className="trpadding">
                        <tr className="trbg">
                          <td>
                            <T>chainStates.communityPool</T> <span className="badge badge-success">Sent</span>  <em className="text-success">{proposal.proposal_content.value.requested_fund[0].amount/Meteor.settings.public.stakingFraction} {Meteor.settings.public.stakingDenom}</em>
                            &nbsp; to <Link to={"/proposals/"+proposal.proposalId}>Proposal#{proposal.proposalId}</Link> 
                       
                          </td>
                        </tr>
                        </Card>
                    // }
                    // else{
                    //   return ''
                    // }
                    
                  })
                }
           
              </UncontrolledCollapse>
              : null}
          </React.Fragment>
          )
        }))

      : null }
    </Col> */}
    </Row>
    </Card>
  );
};


export default class List extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      toggleIndex: "",
      transferTxs: {},
    };
    if (Meteor.isServer) {
      if (this.props.fundingCycles.length > 0) {
        this.state = {
          fundingCycles: this.props.fundingCycles.map((fundingCycle, i) => {
            return <ProposalRow key={i} index={i} fundingCycle={fundingCycle} nodesDetail={this.nodesDetail} isOpen={this.state.isOpen} toggle={this.toggle}
              toggleIndex={this.state.toggleIndex} proposals={this.props.proposals}/>
          })
        }
      }
    }
    else {
      this.state = {
        fundingCycles: null
      }
    }
  }

  toggle = index => {
    this.setState({
      isOpen: !this.state.isOpen,
      toggleIndex: index
    });
  };

  componentDidUpdate(prevState,prevProps) {
    if (this.props.fundingCycles != prevState.fundingCycles) {
      if (this.props.fundingCycles.length > 0) {
        this.setState({
          fundingCycles: this.props.fundingCycles.map((fundingCycle, i) => {
            return <ProposalRow key={i} index={i} fundingCycle={fundingCycle} isOpen={this.state.isOpen} nodesDetail={this.nodesDetail} toggle={this.toggle}
              toggleIndex={this.state.toggleIndex} proposals={this.props.proposals} />
          })
        })
      }
    }
  };

  render() {
    if (this.props.loading) {
      return <Spinner type="grow" color="primary" />
    }
    else if (!this.props.fundingCyclesExist) {
      return <div><T>No Funding Cycle Found</T></div>
    }
    else {
      return <div id="validator-list" className="fundingcycles">
      <Row className="validator-list">
      <Col md={12}>
        <Card body>
          <Row className="header text-nowrap">
            <Col className="d-md-block" md={1}>
              <i className="fas fa-hashtag"></i>
              <span className="d-inline-block d-md-none d-lg-inline-block">
                <T>fundingcycles.cycleID</T>
              </span>
            </Col>
            <Col
              className="submit-block"
              md={2}
            >
              <i className="far fa-clock"></i>
              <span className="d-inline-block d-md-none d-lg-inline-block">
                <T>fundingcycles.cycleStartTime</T> (UTC)
              </span>
            </Col>
            <Col
              className="voting-start"
              md={2}
            >
              <i className="far fa-clock"></i>
              <span className="d-inline-block d-md-none d-lg-inline-block">
                <T>fundingcycles.cycleEndTime</T> (UTC)
              </span>
            </Col>
            <Col
              className="voting-start"
              md={2}
            >
              <i className="fas fa-box-open"></i>
              <span className="d-inline-block d-md-none d-lg-inline-block">
                <T>fundingcycles.fundedproposals</T>
              </span>
            </Col>
          </Row>
        </Card>
        {this.state.fundingCycles}
      </Col>
    </Row>
    </div>
    }
  }
}