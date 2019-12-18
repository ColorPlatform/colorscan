import React, {Component } from 'react';
import { MsgType } from './MsgType.jsx';
import { Link } from 'react-router-dom';
import numbro from 'numbro';
import Account from '../components/Account.jsx';
import i18n from 'meteor/universe:i18n';

const T = i18n.createComponent();

MultiSend = (props) => {
    return <div>
        {/* <p><T>activities.single</T> <MsgType type={props.msg.type} /> <T>activities.happened</T></p> */}
        {/* <p><T>activities.senders</T> */}
        {/* <p> */}
            {/* <ul> */}
                {props.msg.value.inputs.map((data,i) =>{
                    return <li key={i}>{data.coins.map((coin, j) =>{
                    // <li key={i}><Account address={data.address}/> <T>activities.sent</T> {data.coins.map((coin, j) =>{
                        return <p key={j} className="text-success">{numbro(coin.amount/Meteor.settings.public.stakingFraction).format("0,0")} {Meteor.settings.public.stakingDenom}</p>
                    })}
                    </li>
                })}
            {/* </ul> */}
            {/* <T>activities.receivers</T> */}
            {/* <ul>
                {props.msg.value.outputs.map((data,i) =>{
                    return <li key={i}><Account address={data.address}/> <T>activities.received</T> {data.coins.map((coin,j) =>{
                        return <em key={j} className="text-success">{numbro(coin.amount).format("0,0")} {coin.denom}</em>
                    })}</li>
                })}
            </ul> */}
        {/* </p> */}
    </div>
}

export default class Activites extends Component {
    constructor(props){
        super(props);
    }

    render(){
        // console.log(this.props);
        let msg = this.props.msg;
        switch (msg.type){
        // bank
        case "color/MsgSend":
            let amount = '';
            for (let a in msg.value.amount){
                if (a > 0){
                    amount += ', '+numbro(msg.value.amount[a].amount/Meteor.settings.public.stakingFraction).format("0,0")+" "+Meteor.settings.public.stakingDenom;
                }
                else{
                    amount += numbro(msg.value.amount[a].amount/Meteor.settings.public.stakingFraction).format("0,0")+" "+Meteor.settings.public.stakingDenom;
                }
            }
            return <p className="text-success">{amount}</p>
            // return <p><Account address={msg.value.from_address} /> {(this.props.invalid)?<T>activities.failedTo</T>:''}<MsgType type={msg.type} /> <em className="text-success">{amount}</em> <T>activities.to</T> <span className="address"><Account address={msg.value.to_address} /></span><T>common.fullStop</T></p>
        case "color/MsgMultiSend":
            return <MultiSend msg={msg} />
            
            // staking
        case "color/MsgCreateValidator":
        return <p className="text-success">{numbro(msg.value.value.amount/Meteor.settings.public.stakingFraction).format("0,0")} {Meteor.settings.public.stakingDenom}</p>
            // return <p><Account address={msg.value.delegator_address}/> {(this.props.invalid)?<T>activities.failedTo</T>:''}<MsgType type={msg.type} /> <T>activities.operatingAt</T> <span className="address"><Account address={msg.value.validator_address}/></span> <T>activities.withMoniker</T> <Link to="#">{msg.value.description.moniker}</Link><T>common.fullStop</T></p>
        case "color/MsgEditValidator":
            return <p className="text-success">{numbro(msg.value.value.amount/Meteor.settings.public.stakingFraction).format("0,0")} {Meteor.settings.public.stakingDenom}</p>
            // return <p><Account address={msg.value.address}/> {(this.props.invalid)?<T>activities.failedTo</T>:''}<MsgType type={msg.type} /></p>
        case "color/MsgDelegate":
            return <p className="text-warning">{numbro(msg.value.amount.amount/Meteor.settings.public.stakingFraction).format("0,0")} {Meteor.settings.public.stakingDenom}</p>
            // return <p><Account address={msg.value.delegator_address}/> {(this.props.invalid)?<T>activities.failedTo</T>:''}<MsgType type={msg.type} /> <em className="text-warning">{numbro(msg.value.amount.amount).format("0,0")} {msg.value.amount.denom}</em> <T>activities.to</T> <Account address={msg.value.validator_address} /><T>common.fullStop</T></p>
        case "color/MsgUndelegate":
            return <p className="text-warning">{numbro(msg.value.amount.amount/Meteor.settings.public.stakingFraction).format("0,0")} {Meteor.settings.public.stakingDenom}</p>
            // return <p><Account address={msg.value.delegator_address} /> {(this.props.invalid)?<T>activities.failedTo</T>:''}<MsgType type={msg.type} /> <em className="text-warning">{numbro(msg.value.amount.amount).format("0,0")} {msg.value.amount.denom}</em> <T>activities.from</T> <Account address={msg.value.validator_address} /><T>common.fullStop</T></p>
        case "color/MsgBeginRedelegate":
            return <p className="text-warning">{numbro(msg.value.amount.amount/Meteor.settings.public.stakingFraction).format("0,0")} {Meteor.settings.public.stakingDenom}</p>
            // return <p><Account address={msg.value.delegator_address} /> {(this.props.invalid)?<T>activities.failedTo</T>:''}<MsgType type={msg.type} /> <em className="text-warning">{numbro(msg.value.amount.amount).format("0,0")} {msg.value.amount.denom}</em> <T>activities.from</T> <Account address={msg.value.validator_src_address} /> <T>activities.to</T> <Account address={msg.value.validator_dst_address} /><T>common.fullStop</T></p>
            
            // gov
        case "color/MsgSubmitProposal":
            return <p className="text-success">{numbro(msg.value.initial_deposit[0].amount/Meteor.settings.public.stakingFraction).format("0,0")} {Meteor.settings.public.stakingDenom}</p>
            // return <p><Account address={msg.value.proposer} /> {(this.props.invalid)?<T>activities.failedTo</T>:''}<MsgType type={msg.type} /> <T>activities.withTitle</T> <Link to={"/proposals/"+this.props.tags[2].value}>{msg.value.title}</Link><T>common.fullStop</T></p>
        case "color/MsgDeposit":
            return <p className="text-info">{msg.value.amount.map((amount,i) =>{
            // <p><Account address={msg.value.depositor} /> {(this.props.invalid)?<T>activities.failedTo</T>:''}<MsgType type={msg.type} /> <em className="text-info">{msg.value.amount.map((amount,i) =>{
                if (i>0){
                    return " ,"+numbro(amount.amount/Meteor.settings.public.stakingFraction).format("0,0")+" "+Meteor.settings.public.stakingDenom;
                }
                else{
                    return numbro(amount.amount/Meteor.settings.public.stakingFraction).format("0,0")+" "+Meteor.settings.public.stakingDenom;
                }
            })}</p> 
            {/* <T>activities.to</T> <Link to={"/proposals/"+msg.value.proposal_id}><T>proposals.proposal</T> {msg.value.proposal_id}</Link><T>common.fullStop</T> */}
        case "color/MsgVote":
            return <p></p>
            // return <p><Link to={"/proposals/"+msg.value.proposal_id}><T>Proposal</T> {msg.value.proposal_id}</Link> <T>activities.withA</T> <p className="text-info">{msg.value.option}</p></p>
            // return <p><Account address={msg.value.voter} /> {(this.props.invalid)?<T>activities.failedTo</T>:''}<MsgType type={msg.type} />  <Link to={"/proposals/"+msg.value.proposal_id}><T>activities.proposal</T> {msg.value.proposal_id}</Link> <T>activities.withA</T> <em className="text-info">{msg.value.option}</em><T>common.fullStop</T></p>
            
            // distribution
        case "color/MsgWithdrawValidatorCommission":
            return <p></p>
            // return <p><Account address={msg.value.validator_address} /> {(this.props.invalid)?<T>activities.failedTo</T>:''}<MsgType type={msg.type} /><T>common.fullStop</T></p>
        case "color/MsgWithdrawDelegationReward":
            return <p></p>
            // return <p><Account address={msg.value.delegator_address}/> {(this.props.invalid)?<T>activities.failedTo</T>:''}<MsgType type={msg.type} /> <T>activities.from</T> <Account address={msg.value.validator_address} /><T>common.fullStop</T></p>
        case "color/MsgModifyWithdrawAddress":
            return <p></p>
            // return <p><Account address={msg.value.delegator_address}/> {(this.props.invalid)?<T>activities.failedTo</T>:''}<MsgType type={msg.type} /></p>
    
            // slashing
        case "color/MsgUnjail":
            return <p></p>
            // return <p><Account address={msg.value.delegator_address}/> {(this.props.invalid)?<T>activities.failedTo</T>:''}<MsgType type={msg.type} /><T>common.fullStop</T></p>
            
            // ibc
        case "color/IBCTransferMsg":
            return <MsgType type={msg.type} />
        case "color/IBCReceiveMsg":
            return <MsgType type={msg.type} />
    
        default:
            return <div>{JSON.stringify(msg.value)}</div>
        }
    }
}