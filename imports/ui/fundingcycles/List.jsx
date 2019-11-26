import React, { Component } from 'react';
import moment from 'moment';
import { Table, Spinner, Col, Row, Card, UncontrolledCollapse, CardBody } from 'reactstrap';
import i18n from 'meteor/universe:i18n';
import posed from "react-pose";
const T = i18n.createComponent();
// import TransactionActivities from '../components/TransactionActivities.jsx'
// import { IndividualTransaction } from './IndividualTransaction.jsx';
import Transaction from '../transactions/Transaction.jsx'

const Result = posed.div({
  closed: { height: 0 },
  isOpen: { height: "auto" }
});

// let map = new HashMap();



const ProposalRow = (props) => {
  return <React.Fragment>
    <tr>
      <td className="cycleID">{props.fundingCycle.cycle_id}</td>
      <td className="submit-block">{moment.utc(props.fundingCycle.cycle_start_time).format("D MMM YYYY, h:mm:ssa")}</td>
      <td className="voting-start">{moment.utc(props.fundingCycle.cycle_end_time).format("D MMM YYYY, h:mm:ssa")}</td>
      <td className="voting-start">{props.fundingCycle.funded_proposals !== null ? props.fundingCycle.funded_proposals.length : 0}</td>
      <td onClick={() => props.toggle(props.index)} id="toggler">
        <i className="material-icons" >
          {props.index === props.toggleIndex && props.isOpen
            ? "arrow_drop_down"
            : "arrow_left"}
        </i>
      </td>
    </tr>
    <tr>
      {props.fundingCycle.funded_proposals !== null ? (
        props.fundingCycle.funded_proposals.map((type,key)=>{
          return (
            <React.Fragment>
            {props.index === props.toggleIndex && props.isOpen
              ? <UncontrolledCollapse toggler="#toggler">
                {
                  props.proposals.map((proposal,key)=>{
                    
                    if(proposal.proposalId == props.fundingCycle.cycle_id){
                    return  <Card key={key} className="trpadding">
                    <tr className="trbg">
                      <td>
                      
                        community_pool <span className="badge badge-success">Send</span>  <em className="text-success">{proposal.proposal_content.value.requested_fund[0].amount/1000000} &nbsp; {Meteor.settings.public.stakingDenom}</em>
                         &nbsp; to &nbsp; <a href="#">{proposal.proposalId}</a>
                       
                        </td>
                        </tr>
                        </Card>
                    }else{
                      return ''
                    }
                  })
                }
           
              </UncontrolledCollapse>
              : null}
          </React.Fragment>
          )
        }))
: null }
    </tr>
  </React.Fragment>
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
      console.log(this.props, "========")
      if (this.props.fundingCycles.length > 0) {
        this.setState({
          fundingCycles: this.props.fundingCycles.map((fundingCycle, i) => {
            return <ProposalRow key={i} index={i} fundingCycle={fundingCycle} isOpen={this.state.isOpen} nodesDetail={this.nodesDetail} toggle={this.toggle}
              toggleIndex={this.state.toggleIndex} proposals={this.props.proposals} />
          })
        })
      }
    }
  //   if (this.props != prevState){
  //     console.log('transfer txsss',this.props.transferTxs)
  //     this.setState({
  //         transferTxs: this.props.transferTxs,
  //     })    
  // }
  }

  nodesDetail = (league, index) => {
    var count = {};
    return (
      <div>
          {/* Lorem ipsum dolor sit amet consectetur adipisicing elit. Lorem ipsum dolor sit amet consectetur adipisicing elit. */}
        <Transaction/>
      </div>
         
      // <Result className="tally-result-detail">
      //   <Card className="tally-result-table">
       

          // <Row className="header text-nowrap">
          //         <Col className="d-none d-md-block counter" md={1}>
          //           &nbsp;
          //         </Col>
          //         <Col className="individualleague" md={6}>
          //           <i className="material-icons">perm_contact_calendar</i>
          //           <span className="d-inline-block d-md-none d-lg-inline-block">
          //             <T>validators.moniker</T>
          //           </span>
          //         </Col>
          //         <Col
          //           className="individualleague"
          //           md={6}
          //           onClick={e => this.toggleDir(e)}
          //         >
          //           <i className="material-icons">power</i>
          //           <span className="d-inline-block d-md-none d-lg-inline-block">
          //             <T>common.votingPower</T>
          //           </span>
          //           <i className="material-icons">
          //             {this.state.orderDir == 1
          //               ? "arrow_drop_up"
          //               : "arrow_drop_down"}
          //           </i>
          //         </Col>
          //       </Row>

          //  {this.props.fundingCycle.map((item, i) =>
          //       item.league == league ? (
          //           uniqueCount = [...item.league],
          //           uniqueCount.forEach(function(i) { count[i] = (count[i]||0) + 1}),
          //         <Card body key={i}>
          //           <Row className="voter-info">
          //             <Col className="d-none d-md-block counter data" md={1}>
          //               {count[item.league]}
          //             </Col>
          //             <Col className="moniker data" md={4}>
          //               <span className="address overflow-auto d-inline">{moment.utc(item.cycle_start_time).format("D MMM YYYY, h:mm:ssa")}</span>
          //             </Col>
          //             <Col className="voting-power" md={4}>
          //               <i className="material-icons d-md-none">power</i>
          //               {moment.utc(item.cycle_end_time).format("D MMM YYYY, h:mm:ssa")}
          //             </Col>
          //             <Col md={3}></Col>
          //           </Row>
          //         </Card>
          //       ) : ( null
          //       )
          //     )} 
      //   </Card>
      // </Result>
    );
  };

  render() {
    console.log('props in listt',this.props)
    if (this.props.loading) {
      return <Spinner type="grow" color="primary" />
    }
    else if (!this.props.fundingCyclesExist) {
      return <div><T>No Funding Cycle Found</T></div>
    }
    else {
      return <div id="fundingcycles-table" className="fundingcycles-table table-responsive">
        <Table striped className="proposal-list">
          <thead>
            <tr>
              <th><i className="fas fa-hashtag"></i><T>fundingcycles.cycleID</T></th>
              <th className="submit-block"><i className="far fa-clock"></i><T>fundingcycles.cycleStartTime</T> (UTC)</th>
              <th className="voting-start"><i className="far fa-clock"></i><T>fundingcycles.cycleEndTime</T> (UTC)</th>
              <th className="voting-start"><i className="fas fa-box-open"></i><T>fundingcycles.fundedproposals</T></th>
              <th></th>
            </tr>
          </thead>
          <tbody className="fundingtbody">{this.state.fundingCycles}</tbody>
        </Table>
      </div>
    }
  }
}