/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2013 Zimbra Software, LLC.
 *
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.4 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
 */

/**
 * This class manages the display and manipulation of a single message.
 *
 * @see ZtMailMsg
 * @author Conrad Damon <cdamon@zimbra.com>
 */
Ext.define('ZCS.controller.mail.ZtMsgController', {

	extend: 'ZCS.controller.mail.ZtMailItemController',

	config: {

		models: ['ZCS.model.mail.ZtMailMsg'],
		stores: ['ZCS.store.mail.ZtMsgStore'],

		refs: {
			msgHeader: 'msgheader',
			msgBody: 'msgbody',
			msgView: 'msgview',
			// see ZtConstants.MENU_CONFIGS for source of these menu names
			msgActionsMenu: 'list[itemId=msgActionsMenu]',
			msgReplyActionsMenu: 'list[itemId=msgReplyActionsMenu]',
			addressActionsMenu: 'list[itemId=addressActionsMenu]',
			tagActionsMenu: 'list[itemId=tagActionsMenu]'
		},

		control: {
			msgHeader: {
				contactTap: 'showMenu',
				toggleView: 'doToggleView',
				tagTap:     'showMenu'
			},
			msgBody: {
				contactTap:         'showMenu',
				inviteReply:        'doInviteReply',
				attachmentTap:      'doShowAttachment',
				toggleQuotedText:   'doToggleQuotedText',
				loadEntireMessage:  'doLoadEntireMessage',
				addressTouch:       'doComposeToAddress'
			},
			msgActionsMenu: {
				itemtap:            'onActionMenuTap'
			},
			msgReplyActionsMenu: {
				itemtap:            'onActionMenuTap'
			},
			addressActionsMenu: {
				itemtap:            'onMenuItemSelect'
			},
			tagActionsMenu: {
				itemtap:            'onMenuItemSelect'
			},
			'.moveview': {
				messageAssignment: 'saveItemMove'
			},
			'.tagview': {
				messageAssignment: 'saveItemTag'
			},
			'msgview button[cls=zcs-btn-msg-details]': {
				tap: 'onMsgActionsTap'
			},
			'msgview toolbar button[action=cancel]': {
				tap: 'onMsgActionsCancelTap'
			},
			'msgview toolbar button[iconCls=reply]': {
				tap: 'onMsgActionsButtonTap'
			},
			'msgview toolbar button[iconCls=trash]': {
				tap: 'onMsgActionsButtonTap'
			},
			'msgview toolbar button[iconCls=arrow_down]': {
				tap: 'onMsgActionsButtonTap'
			},
			'msgview toolbar': {
				show: 'onMsgViewToolbarShow'
			}
		},

		tagId: ''
	},

	onMsgActionsTap: function (button, e) {

		var msgView = button.up('msgview'),
			itemPanel = msgView && msgView.up('itempanel');

		if (itemPanel && itemPanel.isAssignment) {
			return;
		}

		if (this.actionMsgView && this.actionMsgView !== msgView) {
			this.hideActionMenu();
		}
		this.actionMsgView = msgView;

		var	actionMenu = msgView.down('toolbar[cls=zcs-msg-actions-toolbar]'),
			actionMenuContainer = msgView.down('#toolbarContainer');

		actionMenuContainer.show();
		actionMenu.show();
		button.hide();
		
		actionMenu.up('list').getScrollable().getScroller().scrollBy(0, actionMenu.getHeight() * 1.5);
	},

	onMsgActionsCancelTap: function (button, e) {
		this.hideActionMenu(button);
		// container hide is done in actionMenu hide listener
	},

	hideActionMenu: function(button) {

		var msgView = this.actionMsgView,
			actionMenu = msgView && msgView.down('toolbar[cls=zcs-msg-actions-toolbar]'),
			actionMenuButton = msgView && msgView.down('button[cls=zcs-btn-msg-details]');

		if (actionMenu && actionMenuButton) {
			actionMenuButton.show();
			actionMenu.hide();
		}
	},

	onMsgActionsButtonTap: function (button, e) {

		var msgView = this.actionMsgView = button.up('msgview'),
			msg = msgView.getMsg();

		if (button.get('iconCls') == 'trash') {
			this.hideActionMenu();
			this.doDelete({msg: msg});
		} else {
			this.showMenu(button, {
				menuName:   button.initialConfig ? button.initialConfig.menuName : undefined,
				msg:        msg
			});
		}
	},

	onMsgViewToolbarShow: function (toolbar, eOpts) {
		if (toolbar.up('msgview').element.hasCls('x-list-item-last')) {
			toolbar.up('list').getScrollable().getScroller().scrollToEnd();
		}
	},

	/**
	 * Figure out what state the msg header should be in. There are three states: collapsed, expanded,
	 * and detailed. For all but collapsed, we show the msg body. Tapping the header toggles whether it
	 * is collapsed. A 'details' link toggles between expanded and detailed.
	 *
	 * @param {ZtMsgHeader} msgHeader       the message header
	 * @param {Boolean}     detailsTapped   true if the 'details' (or 'hide') link was tapped
	 */
	doToggleView: function(msgHeader, detailsTapped) {

		var msgView = msgHeader.up('msgview'),
			msg = msgView.getMsg(),
			curExpanded = msgView.getExpanded(),
			curState = msgView.getState(),
			newExpanded, newState,
			msgToolbarBtn = msgView.down('button[cls=zcs-btn-msg-details]');

		if (!detailsTapped) {
			newState = curExpanded ? ZCS.constant.HDR_COLLAPSED : ZCS.constant.HDR_EXPANDED;
		}
		else {
			newState = (curState === ZCS.constant.HDR_EXPANDED) ? ZCS.constant.HDR_DETAILED : ZCS.constant.HDR_EXPANDED;
		}

		newExpanded = (newState !== ZCS.constant.HDR_COLLAPSED);

		msgView.setExpanded(newState === ZCS.constant.HDR_EXPANDED || newState === ZCS.constant.HDR_DETAILED);

		msgView.setState(newState);

		//<debug>
        Ext.Logger.info("Header state: " + newState + " (" + newExpanded + ")");
        //</debug>

        msgView.updateExpansion();
    	msgView.renderHeader();

		if (newExpanded && msg && !msg.get('isLoaded')) {
			msg.save({
				op: 'load',
				id: msg.getId(),
				success: function() {
					if (newExpanded) {
						msgView.renderBody();
						if (!msgView.usingIframe()) {
							msgView.updateHeight();
						}
					} else {
						msgView.updateHeight();
					}
				}
			});
		}
		else {
			//The body might not be rendered if we are going to expanded from not expanded.
			if (newExpanded) {
				msgView.renderBody();
				if (!msgView.usingIframe()) {
					msgView.updateHeight();
				}
			} else {
				msgView.updateHeight();
			}
		}
	},

	doComposeToAddress: function (address) {
		var addressModel = ZCS.model.mail.ZtEmailAddress.fromEmail(address, ZCS.constant.TO);
		ZCS.app.getComposeController().showComposeForm([addressModel]);
	},

	doInviteReply: function(origMsgId, action) {

		var	origMsg = ZCS.util.findItemInActiveStore(ZCS.constant.ITEM_MESSAGE, origMsgId);
		if (!origMsg) {
			return;
		}

		var	invite = origMsg.get('invite'),
			msg = Ext.create('ZCS.model.mail.ZtMailMsg'),
			invReplySubject = ZCS.constant.INVITE_REPLY_PREFIX[action] + ": " + invite.get('subject');

		msg.set('origId', origMsgId);
		msg.set('inviteAction', action);
		msg.set('replyType', 'r');

		msg.set('subject', invReplySubject);

		var from = ZCS.mailutil.getFromAddress();
		msg.addAddresses(from);

		if (!invite.get('isOrganizer')) {
			var	organizer = invite.get('organizer'),
				organizerEmail = organizer && organizer.get('email'),
				toEmail = organizerEmail || invite.get('sentBy'),
				toAddress;

			if (!toEmail) {
				var origFrom = origMsg.getAddressByType(ZCS.constant.FROM),
					origEmail = origFrom && origFrom.get('email');

				if (origEmail !== from.get('email')) {
					toEmail = origEmail;
				}
			}
			if (toEmail) {
				msg.addAddresses(ZCS.model.mail.ZtEmailAddress.fromEmail(toEmail, ZCS.constant.TO));
			}
		}

		var replyBody = invite.getSummary(true) + ZCS.constant.INVITE_REPLY_TEXT[action] + '<br><br>';

		msg.createMime(replyBody, true);
		msg.save({
			isInviteReply: true,
			success: function () {
				ZCS.app.fireEvent('showToast', ZtMsg.invReplySent);
			}
		});
	},

	doShowAttachment: function(el) {

		var idParams = ZCS.util.getIdParams(el.dom.id),
			url = idParams && idParams.url;

		if (url) {
			window.open(url, '_blank');
		}
	},

	doToggleQuotedText: function(msgBody) {
		var msgView = msgBody.up('msgview'),
			msg = msgView.getMsg();

		msgView.renderBody(!msgBody.showingQuotedText);
		msgView.updateHeight();
	},

	/**
	 * Starts a new compose session.
	 *
	 * @param {String}  addr    email address of recipient (To: field)
	 */
	doCompose: function(actionParams) {
		var msg = actionParams.msg,
			toAddr = msg.getAddressObject('email', actionParams.address);

		ZCS.app.getComposeController().showComposeForm([toAddr]);
	},

	doReply: function(actionParams) {
		this.composeAction(actionParams, 'reply');
	},

	doReplyAll: function(actionParams) {
		this.composeAction(actionParams, 'replyAll');
	},

	doForward: function(actionParams) {
		this.composeAction(actionParams, 'forward');
	},

	/**
	 * Replies to or forwards a message, making sure the message is loaded first so its content can be retrieved.
	 *
	 * @param {Object}  actionParams    params from menu action
	 * @param {String}  method          method in ZtComposeController to invoke
	 */
	composeAction: function(actionParams, method) {

		var msg = actionParams.msg,
			ctlr = ZCS.app.getComposeController();

		if (!msg.get('isLoaded')) {
			msg.save({
				op: 'load',
				id: msg.getId(),
				success: function() {
					ctlr[method](msg);
				}
			});
		}
		else {
			ctlr[method](msg);
		}
	},

	doAddContact: function(actionParams) {
		var addrObj = actionParams.addrObj || Ext.create('ZCS.model.mail.ZtEmailAddress', { email: actionParams.address });
		ZCS.app.getContactController().showContactForm(ZCS.constant.OP_COMPOSE, ZCS.model.contacts.ZtContact.fromEmailObj(addrObj));
	},

	/**
	 * Searches for mail from the given sender.
	 */
	doSearch: function(actionParams) {
		ZCS.app.getConvListController().doSearch('from:' + actionParams.address);
	},

	doLoadEntireMessage: function(msg, msgBody) {

		var msgView = msgBody.up('msgview');

		msg.save({
			op:     'load',
			id:     msg.getId(),
			noMax:  true,
			success: function() {
				msgView.render(msg);
				msgView.updateHeight();
			}
		}, this);
	},

	/**
	 * If the msg is already in Trash, permanently delete it.
	 */
	doDelete: function(actionParams) {

		var msg = actionParams.msg,
			localFolderId = msg ? ZCS.util.localId(msg.get('folderId')) : '';

		if (localFolderId === ZCS.constant.ID_TRASH || localFolderId === ZCS.constant.ID_JUNK) {
			Ext.Msg.confirm(ZtMsg.hardDeleteMsgTitle, ZtMsg.hardDeleteMsgText, function(buttonId) {
				if (buttonId === 'yes') {
						this.performOp(msg, 'delete', function() {
						ZCS.app.fireEvent('showToast', ZtMsg.messageDeleted);
					});
				}
			}, this);
		}
		else {
			this.callParent(arguments);
		}
	},

	/**
	 * Make sure the action menu shows the appropriate action based on the unread status of this conversation.
	 * The action will be either Mark Read or Mark Unread.
	 */
	updateMenuLabels: function(menuButton, params, menu) {

		var message = this.getMsgHeader().up('msgview').getMsg();

		var menuName = params.menuName;

		if (menuName === ZCS.constant.MENU_MSG) {
			var	unreadLabel, flagLabel, spamLabel;

			unreadLabel = message.get('isUnread') ? ZtMsg.markRead : ZtMsg.markUnread;
			flagLabel = message.get('isFlagged') ? ZtMsg.unflag : ZtMsg.flag;
			spamLabel = (message.get('folderId') === ZCS.constant.ID_JUNK) ? ZtMsg.markNotSpam : ZtMsg.markSpam;

			var store = menu.getStore(),
				unreadAction = menu.getItemAt(store.find('action', ZCS.constant.OP_MARK_READ)),
				flagAction = menu.getItemAt(store.find('action', ZCS.constant.OP_FLAG)),
				spamAction = menu.getItemAt(store.find('action', ZCS.constant.OP_SPAM));

			if (unreadAction) {
				unreadAction.getRecord().set('label', unreadLabel);
			}
			if (flagAction) {
				flagAction.getRecord().set('label', flagLabel);
			}
			if (spamAction) {
				spamAction.getRecord().set('label', spamLabel);
			}
		}
		else if (menuName === ZCS.constant.MENU_ADDRESS) {
			// Hiding/showing address listitems instead of changing labels
			menu.hideItem(ZCS.constant.OP_ADD_CONTACT, true);
			menu.hideItem(ZCS.constant.OP_EDIT, true);

			// Pick which listitem to show, only if contacts app is enabled
			if (ZCS.util.isAppEnabled(ZCS.constant.APP_CONTACTS)) {
				var	email = params.addrObj && params.addrObj.get('email');
				if (email && ZCS.app.getContactListController().getDataFieldByEmail(email, 'exists')) {
					menu.hideItem(ZCS.constant.OP_EDIT, false);
				}
				else {
					menu.hideItem(ZCS.constant.OP_ADD_CONTACT, false);
				}
			}
		}
	},

	/**
	 * Disable "Tag" action if user doesn't have any tags.
	 */
	enableMenuItems: function(menu) {

		var menuName = menu && menu.getName();

		if (menuName === 'msgActions') {
			var curFolder = ZCS.session.getCurrentSearchOrganizer(),
				isFeed = curFolder && curFolder.isFeed(),
				isDrafts = ZCS.util.folderIs(curFolder, ZCS.constant.ID_DRAFTS);

			menu.enableItem(ZCS.constant.OP_REPLY, !isFeed);
			menu.enableItem(ZCS.constant.OP_REPLY_ALL, !isFeed);
			menu.enableItem(ZCS.constant.OP_SPAM, !isDrafts);

	        this.enableTagItem(menu);
		}
	},

	// hide menu and perform the selected action
	onActionMenuTap: function(list, index, target, record, e) {
		this.hideActionMenu();
		this.onMenuItemSelect(list, index, target, record, e);
	}
});
