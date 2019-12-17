import React, {Component } from 'react';
import { MsgType } from './MsgType.jsx';
import i18n from 'meteor/universe:i18n';

const T = i18n.createComponent();

MultiSend = (props) => {
    return <div>
        <MsgType type={props.msg.type} />
    </div>
}

export default class ButtonActivites extends Component {
    constructor(props){
        super(props);
    }

    render(){
        let msg = this.props.msg;
        switch (msg.type){
        // bank
        case "color/MsgSend":
            return <MsgType type={msg.type} />
        case "color/MsgMultiSend":
            return <MultiSend msg={msg} />
            
            // staking
        case "color/MsgCreateValidator":
            return <MsgType type={msg.type} />
        case "color/MsgEditValidator":
            return <MsgType type={msg.type} />
        case "color/MsgDelegate":
            return <MsgType type={msg.type} />
        case "color/MsgUndelegate":
            return <MsgType type={msg.type} />
        case "color/MsgBeginRedelegate":
            return <MsgType type={msg.type} />
            
            // gov
        case "color/MsgSubmitProposal":
            return <MsgType type={msg.type} />
        case "color/MsgDeposit":
            return <MsgType type={msg.type} />
        case "color/MsgVote":
            return <MsgType type={msg.type} />
            
            // distribution
        case "color/MsgWithdrawValidatorCommission":
            return <MsgType type={msg.type} />
        case "color/MsgWithdrawDelegationReward":
            return <MsgType type={msg.type} />
        case "color/MsgModifyWithdrawAddress":
            return <MsgType type={msg.type} />
    
            // slashing
        case "color/MsgUnjail":
            return <MsgType type={msg.type} />
            
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