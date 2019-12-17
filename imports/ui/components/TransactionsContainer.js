import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Transactions } from '/imports/api/transactions/transactions.js';
import ValidatorTransactions from './Transactions.jsx';

export default TransactionsContainer = withTracker((props) => {
    let transactionsHandle, transactions, transactionsExist;
    let loading = true;

    if (Meteor.isClient){
        transactionsHandle = Meteor.subscribe('transactions.validator', props.validator, props.delegator, props.limit);
        loading = !transactionsHandle.ready();
    }

    if (Meteor.isServer || !loading){
        transactions = Transactions.find({}, {sort:{height:-1}});

        if (Meteor.isServer){
            loading = false;
            transactionsExist = !!transactions;
        }
        else{
            transactionsExist = !loading && !!transactions;
        }
    }

    return {
        loading,
        transactionsExist,
        transferTxs: transactionsExist ? Transactions.find({
            $or: [
                {"tx.value.msg.type":"color/MsgSend"},
                {"tx.value.msg.type":"color/MsgMultiSend"}
            ]
        }).fetch() : {},
        stakingTxs: transactionsExist ? Transactions.find({
            $or: [
                {"tx.value.msg.type":"color/MsgCreateValidator"},
                {"tx.value.msg.type":"color/MsgEditValidator"},
                {"tx.value.msg.type":"color/MsgDelegate"},
                {"tx.value.msg.type":"color/MsgUndelegate"},
                {"tx.value.msg.type":"color/MsgBeginRedelegate"}
            ]
        }).fetch() : {},
        distributionTxs: transactionsExist ? Transactions.find({
            $or: [
                {"tx.value.msg.type":"color/MsgWithdrawValidatorCommission"},
                {"tx.value.msg.type":"color/MsgWithdrawDelegationReward"},
                {"tx.value.msg.type":"color/MsgModifyWithdrawAddress"}
            ]
        }).fetch() : {},
        governanceTxs: transactionsExist ? Transactions.find({
            $or: [
                {"tx.value.msg.type":"color/MsgSubmitProposal"},
                {"tx.value.msg.type":"color/MsgDeposit"},
                {"tx.value.msg.type":"color/MsgVote"}
            ]
        }).fetch() : {},
        slashingTxs: transactionsExist ? Transactions.find({
            $or: [
                {"tx.value.msg.type":"color/MsgUnjail"}
            ]
        }).fetch() : {},
        IBCTxs: transactionsExist ? Transactions.find({
            $or: [
                {"tx.value.msg.type":"color/IBCTransferMsg"},
                {"tx.value.msg.type":"color/IBCReceiveMsg"}
            ]
        }).fetch() : {}
    };
})(ValidatorTransactions);
