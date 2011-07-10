/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2004, 2005, 2006, 2007, 2008, 2009, 2010 Zimbra, Inc.
 *
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.3 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
 */

/**
 * @overview
 * This file contains the contact controller class.
 * 
 */

/**
 * Creates the contact controller.
 * @class
 * This class represents the contact controller.
 *
 * @param	{DwtControl}	container		the container
 * @param	{ZmContactsApp}	abApp	the contacts application
 *
 * @extends		ZmListController
 */
ZmContactController = function(container, abApp) {

	ZmListController.call(this, container, abApp);

	this._listeners[ZmOperation.SAVE] = new AjxListener(this, this._saveListener);
	this._listeners[ZmOperation.CANCEL] = new AjxListener(this, this._cancelListener);

	this._tabGroupDone = {};
};

ZmContactController.prototype = new ZmListController();
ZmContactController.prototype.constructor = ZmContactController;

/**
 * Returns a string representation of the object.
 * 
 * @return		{String}		a string representation of the object
 */
ZmContactController.prototype.toString =
function() {
	return "ZmContactController";
};

/**
 * Shows the contact.
 *
 * @param	{ZmContact}	contact		the contact
 * @param	{Boolean}	isDirty		<code>true</code> to mark the contact as dirty
 */
ZmContactController.prototype.show =
function(contact, isDirty) {
	this._contact = contact;
	this._currentView = this.viewId; //note - _currentView is the viewID (tab specific). E.g. CN1, CN2, etc
	if (isDirty) this._contactDirty = true;
	this._list = contact.list;

	if (!this._toolbar[this._currentView]) {
		this._initializeToolBar(this._currentView);
	}
	this._resetOperations(this._toolbar[this._currentView], 1); // enable all buttons

	this._createView(this._currentView);

	this._setViewContents();
	this._initializeTabGroup(this._currentView);
	this._app.pushView(this.viewId);

};

ZmContactController.prototype._createView =
function(viewId) {
	if (this._contactView) {
		return;
	}
	var view = this._contactView = this._createContactView();
	//Note - I store this in this._view just to be consistent with certain calls such as for ZmBaseController.prototype._initializeTabGroup. Even though there's no real reason to keep an array of views per type since each controller would only have one view and therefor one type
	this._view[viewId] = view;

	var callbacks = {};
		callbacks[ZmAppViewMgr.CB_PRE_HIDE] = new AjxCallback(this, this._preHideCallback);
		callbacks[ZmAppViewMgr.CB_PRE_UNLOAD] = new AjxCallback(this, this._preUnloadCallback);
		callbacks[ZmAppViewMgr.CB_POST_SHOW] = new AjxCallback(this, this._postShowCallback);
	var elements = this.getViewElements(null, view, this._toolbar[viewId]);

	this._app.createView({viewId:viewId, elements:elements, callbacks:callbacks, tabParams:this._getTabParams()});
};

ZmContactController.prototype._postShowCallback =
function() {
	//have to call it since it's overriden in ZmBaseController to do nothing.
	ZmController.prototype._postShowCallback.call(this);
};

ZmContactController.prototype._getTabParams =
function() {
	var text = this._isGroup() ? ZmMsg.group : ZmMsg.contact;

	return {id:this.tabId,
			image: this._isGroup() ? "NewGroup" : "NewContact",
			text: text,
			textPrecedence:77,
			tooltip: text};
};


ZmContactController.prototype.getKeyMapName =
function() {
	return "ZmContactController";
};

ZmContactController.prototype.handleKeyAction =
function(actionCode) {
	DBG.println("ZmContactController.handleKeyAction");
	switch (actionCode) {

		case ZmKeyMap.SAVE:
			this._saveListener();
			break;

		case ZmKeyMap.CANCEL:
			this._cancelListener();
			break;
	}
	return true;
};

/**
 * Enables the toolbar.
 *
 * @param	{Boolean}	enable	<code>true</code> to enable
 */
ZmContactController.prototype.enableToolbar =
function(enable) {
	if (enable) {
		this._resetOperations(this._toolbar[this._currentView], 1);
	} else {
		this._toolbar[this._currentView].enableAll(enable);
	}
};

// Private methods (mostly overrides of ZmListController protected methods)

/**
 * @private
 */
ZmContactController.prototype._getToolBarOps =
function() {
	return [ZmOperation.SAVE, ZmOperation.CANCEL,
			ZmOperation.SEP,
			ZmOperation.PRINT, ZmOperation.DELETE,
			ZmOperation.SEP,
			ZmOperation.TAG_MENU];
};

/**
 * @private
 */
ZmContactController.prototype._getActionMenuOps =
function() {
	return null;
};

/**
 * @private
 */
ZmContactController.prototype._getViewType =
function() {
	//note - this is required to return the current view ID and not really type, by ZmBaseController.prototype._tagListener in order to actually tag.
	return this.viewId;
};


/**
 * @private
 */
ZmContactController.prototype._isGroup =
function() {
	return this._contact.isGroup();
};


ZmContactController.prototype._createContactView =
function() {
	return this._isGroup()
			? new ZmGroupView(this._container, this)
			: new ZmEditContactView(this._container, this);
};

/**
 * @private
 */
ZmContactController.prototype._initializeToolBar =
function(view) {
	ZmListController.prototype._initializeToolBar.call(this, view);

	this._setNewButtonProps(view, ZmMsg.newContact, ZmMsg.createNewContact, "NewContact", "NewContactDis", ZmOperation.NEW_CONTACT);

	var tb = this._toolbar[view];

	// change the cancel button to "close" if editing existing contact
	var cancelButton = tb.getButton(ZmOperation.CANCEL);
	if (this._contact.id == undefined || this._contact.isGal) {
		cancelButton.setText(ZmMsg.cancel);
	} else {
		cancelButton.setText(ZmMsg.close);
	}

	var saveButton = tb.getButton(ZmOperation.SAVE);
	if (saveButton) {
		saveButton.setToolTipContent(ZmMsg.saveContactTooltip);
	}

	appCtxt.notifyZimlets("initializeToolbar", [this._app, tb, this, view], {waitUntilLoaded:true});
};

/**
 * @private
 */
ZmContactController.prototype._getTagMenuMsg =
function() {
	return ZmMsg.AB_TAG_CONTACT;
};

/**
 * @private
 */
ZmContactController.prototype._setViewContents =
function() {
	var cv = this._contactView;
	cv.set(this._contact, this._contactDirty);
	if (this._contactDirty) {
		delete this._contactDirty;
	}

};

/**
 * @private
 */
ZmContactController.prototype._createTabGroup = function() {
	var viewId = this._currentView;
	return this._tabGroups[viewId] = new DwtTabGroup(this.toString() + "_" + viewId);
};

/**
 * @private
 */
ZmContactController.prototype._initializeTabGroup =
function(viewId) {
	if (this._tabGroups[viewId]) return;
	ZmListController.prototype._initializeTabGroup.apply(this, arguments);
	var toolbar = this._toolbar[viewId];
	if (toolbar) {
		this._tabGroups[viewId].addMember(toolbar, 0);
	}
	this._tabGroup = this._tabGroups[viewId];
};

/**
 * @private
 */
ZmContactController.prototype._paginate =
function(view, bPageForward) {
	// TODO? - page to next/previous contact
};

/**
 * @private
 */
ZmContactController.prototype._resetOperations =
function(parent, num) {
	if (!parent) return;
	if (this._contact.id == undefined || this._contact.isGal) {
		// disble all buttons except SAVE and CANCEL
		parent.enableAll(false);
		parent.enable([ZmOperation.SAVE, ZmOperation.CANCEL], true);
	} else if (this._contact.isShared()) {
		parent.enableAll(true);
		parent.enable(ZmOperation.TAG_MENU, false);
	} else {
		ZmListController.prototype._resetOperations.call(this, parent, num);
	}
};

/**
 * @private
 */
ZmContactController.prototype._saveListener =
function(ev, bIsPopCallback) {
	var fileAsChanged = false;
	var view = this._contactView;
	if (view instanceof DwtForm)
		view.validate();
	if (!view.isValid()) {
		var invalidItems = view.getInvalidItems();
		for (var i=0; i<invalidItems.length; i++) {
			msg = view.getErrorMessage(invalidItems[i]);
			if (AjxUtil.isString(msg)) {
				//var msg = ZmMsg.errorSaving + (ex ? (":<p>" + ex) : ".");
				msg = msg ? AjxMessageFormat.format(ZmMsg.errorSavingWithMessage, msg) : ZmMsg.errorSaving;
				var ed = appCtxt.getMsgDialog();
				if (ed) {
					ed.setMessage(msg, DwtMessageDialog.CRITICAL_STYLE);
					ed.popup();
				} else {
					appCtxt.setStatusMsg(msg, ZmStatusView.LEVEL_CRITICAL);
				}
				return;
			}
		}
		return;
	}

	var mods = view.getModifiedAttrs();
	view.enableInputs(false);

	if (mods) {
		var contact = view.getContact();

		// bug fix #22041 - when moving betw. shared/local folders, dont modify
		// the contact since it will be created/deleted into the new folder
		var newFolderId = mods[ZmContact.F_folderId];
		var newFolder = newFolderId ? appCtxt.getById(newFolderId) : null;
		if (contact.id != null && newFolderId &&
			(contact.isShared() || (newFolder && newFolder.link)))
		{
			// update existing contact with new attrs
			for (var a in mods) {
				if (a != ZmContact.F_folderId) {
					contact.attr[a] = mods[a];
				}
			}
			// set folder will do the right thing for this shared contact
			contact._setFolder(newFolderId);
		}
		else
		{
			if (contact.id && !contact.isGal) {
				if (view.isEmpty()) { //If contact empty, alert the user
					var ed = appCtxt.getMsgDialog();
					ed.setMessage(ZmMsg.emptyContactSave, DwtMessageDialog.CRITICAL_STYLE);
					ed.popup();
					view.enableInputs(true);
					bIsPopCallback = true;
				} else {
					var contactFileAsBefore = ZmContact.computeFileAs(contact);
					var contactFileAsAfter = ZmContact.computeFileAs(AjxUtil.hashUpdate(AjxUtil.hashCopy(contact.getAttrs()), mods, true));
					this._doModify(contact, mods);
					if (contactFileAsBefore.toLowerCase()[0] != contactFileAsAfter.toLowerCase()[0])
						fileAsChanged=true;
				}
			} else {
				var isEmpty = true;
				for (var a in mods) {
					if (mods[a]) {
						isEmpty = false;
						break;
					}
				}
				if (isEmpty) {
					var msg = this._isGroup()
						? ZmMsg.emptyGroup
						: ZmMsg.emptyContact;
					appCtxt.setStatusMsg(msg, ZmStatusView.LEVEL_WARNING);
				}
				else {
					var clc = AjxDispatcher.run("GetContactListController");
					var list = (clc && clc.getList()) || new ZmContactList(null);
					fileAsChanged = true;
					this._doCreate(list, mods);
				}
			}
		}
	} else {
		// bug fix #5829 - differentiate betw. an empty contact and saving
		//                 an existing contact w/o editing
		if (view.isEmpty()) {
			var msg = this._isGroup()
				? ZmMsg.emptyGroup
				: ZmMsg.emptyContact;
			appCtxt.setStatusMsg(msg, ZmStatusView.LEVEL_WARNING);
		} else {
			var msg = this._isGroup()
				? ZmMsg.groupSaved
				: ZmMsg.contactSaved;
			appCtxt.setStatusMsg(msg, ZmStatusView.LEVEL_INFO);
		}
	}

	if (!bIsPopCallback) {
		this._app.popView(true);
		view.cleanup();
	}
	if (fileAsChanged) // bug fix #45069 - if the contact is new, change the search to "all" instead of displaying contacts beginning with a specific letter
		ZmContactAlphabetBar.alphabetClicked(null);

    return true;
};

/**
 * @private
 */
ZmContactController.prototype._cancelListener =
function(ev) {
	this._app.popView();
};

/**
 * @private
 */
ZmContactController.prototype._printListener =
function(ev) {
	var url = "/h/printcontacts?id=" + this._contact.id;
    if (appCtxt.isOffline) {
        var acctName = this._contact.getAccount().name;
        url+="&acct=" + acctName ;
    }
	window.open(appContextPath+url, "_blank");
};

/**
 * @private
 */
ZmContactController.prototype._doDelete =
function(items, hardDelete, attrs, skipPostProcessing) {
	ZmListController.prototype._doDelete.call(this, items, hardDelete, attrs);
	appCtxt.getApp(ZmApp.CONTACTS).updateIdHash(items, true);

	if (!skipPostProcessing) {
		// disable input fields (to prevent blinking cursor from bleeding through)
		this._contactView.enableInputs(false);
		this._app.popView(true);
	}
};

/**
 * @private
 */
ZmContactController.prototype._preHideCallback =
function(view, force) {
	ZmController.prototype._preHideCallback.call(this);

	if (force) return true;

	var view = this._contactView;
	if (!view.isDirty()) {
		view.cleanup();
		return true;
	}

	var ps = this._popShield = appCtxt.getYesNoCancelMsgDialog();
	ps.reset();
	ps.setMessage(ZmMsg.askToSave, DwtMessageDialog.WARNING_STYLE);
	ps.registerCallback(DwtDialog.YES_BUTTON, this._popShieldYesCallback, this);
	ps.registerCallback(DwtDialog.NO_BUTTON, this._popShieldNoCallback, this);
	ps.popup(view._getDialogXY());

	return false;
};

/**
 * @private
 */
ZmContactController.prototype._preUnloadCallback =
function(view) {
	return !this._contactView.isDirty();
};

/**
 * @private
 */
ZmContactController.prototype._popShieldYesCallback =
function() {
    this._popShield.popdown();
	if (this._saveListener(null, true)) {
        this._popShieldCallback();
    }
};

/**
 * @private
 */
ZmContactController.prototype._popShieldNoCallback =
function() {
    this._popShield.popdown();
    this._popShieldCallback();
};

/**
 * @private
 */
ZmContactController.prototype._popShieldCallback = function() {
    appCtxt.getAppViewMgr().showPendingView(true);
    this._contactView.cleanup();
};

/**
 * @private
 */
ZmContactController.prototype._menuPopdownActionListener =
function(ev) {
	// bug fix #3719 - do nothing
};

/**
 * @private
 */
ZmContactController.prototype._getDefaultFocusItem =
function() {
	return this._contactView._getDefaultFocusItem();
};
