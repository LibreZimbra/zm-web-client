<%--
 * ***** BEGIN LICENSE BLOCK *****
 * 
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2009 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Yahoo! Public License
 * Version 1.0 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * 
 * ***** END LICENSE BLOCK *****
--%>
<%@ tag body-content="empty" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="fmt" uri="com.zimbra.i18n" %>
<%@ taglib prefix="mo" uri="com.zimbra.mobileclient" %>
<%@ taglib prefix="zm" uri="com.zimbra.zm" %>
<%@ attribute name="type" rtexprvalue="true" required="true" %>
<%@ attribute name="st" rtexprvalue="true" required="true" %>
<%@ attribute name="url" rtexprvalue="true" required="false" %>
<%@ attribute name="hide" rtexprvalue="true" required="false" %>
<%@ attribute name="id" rtexprvalue="true" required="false" %>

<zm:getMailbox var="mailbox"/>
<c:choose>
<c:when test="${type eq 'folder'}">
    <div class="table View" id="nfldrfrm" style="${hide ? 'display:none':''};">
        <div class="table-row">
            <div class="table-cell">
                <form action="${url}" method="post"
                      onsubmit="return submitForm(this);">
                    <c:if test="${not empty id}">
                        <c:set var="efolder" value="${zm:getFolder(pageContext, fn:escapeXml(id))}"/>
                        <input type="hidden" name="efolderid" value="${efolder.id}">
                    </c:if>
                    <input type="hidden" name="doFolderAction" value="1">
                    <input name="crumb" type="hidden" value="${fn:escapeXml(mailbox.accountInfo.crumb)}"/>
                    <input name="st" type="hidden" value="${fn:escapeXml(st)}"/>

                    <div class="table">
                        <div class="table-row">
                                <span class="label table-cell"><fmt:message key="nameLabel"/> <input type="text"
                                                                                                 name="folder_name"
                                                                                                 style=""
                                                                                                 class="Textarea"
                                                                                                 value="${efolder.name}">
                                    <input
                                            class="zo_button" type="submit"
                                            name="action${not empty efolder ? 'Modify':'Save'}Folder"
                                            value="<fmt:message key='save'/>"></span>
                        </div>
                    </div>
                    <div class="table">
                        <div class="table-row">
                            <div class="table-cell">
                                <c:choose>
                                    <c:when test="${empty st || st eq 'folders' || st eq mailbox.prefs.groupMailBy}">
                                        <hr size="1"/>
                                        <select name="parentid" style="width:100px;height:100%;">
                                            <option value="${mailbox.inbox.parentId}">--<fmt:message key="in"/>--
                                            </option>

                                            <zm:forEachFolder parentid="${mailbox.inbox.id}" var="fldr"
                                                              skiproot="false">
                                                <c:if test="${(fldr.isContactMoveTarget || fldr.isMessageMoveTarget) && (empty efolder || efolder.id != fldr.id)}">
                                                    <option value="${fldr.id}" ${fldr.id eq efolder.parentId? 'selected=selected' : ''}>${zm:getFolderPath(pageContext, fldr.id)}</option>
                                                </c:if>
                                            </zm:forEachFolder>
                                            <zm:forEachFolder parentid="${mailbox.sent.id}" var="fldr"
                                                              skiproot="false">
                                                <c:if test="${(fldr.isContactMoveTarget || fldr.isMessageMoveTarget) && (empty efolder || efolder.id != fldr.id)}">
                                                    <option value="${fldr.id}" ${fldr.id eq efolder.parentId? 'selected=selected' : ''}>${zm:getFolderPath(pageContext, fldr.id)}</option>
                                                </c:if>
                                            </zm:forEachFolder>
                                            <zm:forEachFolder parentid="${mailbox.drafts.id}" var="fldr"
                                                              skiproot="false">
                                                <c:if test="${(fldr.isContactMoveTarget || fldr.isMessageMoveTarget) && (empty efolder || efolder.id != fldr.id)}">
                                                    <option value="${fldr.id}" ${fldr.id eq efolder.parentId? 'selected=selected' : ''}>${zm:getFolderPath(pageContext, fldr.id)}</option>
                                                </c:if>
                                            </zm:forEachFolder>
                                            <zm:forEachFolder var="fldr" skiproot="${true}" skipsystem="${true}"
                                                              skiptopsearch="${true}">
                                                <c:if test="${(fldr.isContactMoveTarget || fldr.isMessageMoveTarget) && (empty efolder || efolder.id != fldr.id)}">
                                                    <option value="${fldr.id}" ${fldr.id eq efolder.parentId? 'selected=selected' : ''}>${zm:getFolderPath(pageContext, fldr.id)}</option>
                                                </c:if>
                                            </zm:forEachFolder>
                                        </select>
                                    </c:when>
                                    <c:when test="${st eq 'ab' || st eq 'contact'}">
                                                            <hr size="1"/>
                                        <select name="parentid" style="width:100px;">
                                            <option value="${mailbox.contacts.parentId}">--<fmt:message key="in"/>--
                                            </option>
                                            <zm:forEachFolder var="fldr" parentid="${mailbox.contacts.parentId}"
                                                              skiproot="false" skiptrash="true">
                                                <c:if test="${fldr.isContactMoveTarget && (empty efolder || efolder.id ne fldr.id)}">
                                                    <option value="${fldr.id}" ${efolder.parentId eq fldr.id ? 'selected=selected' : ''}>${zm:getFolderPath(pageContext, fldr.id)}</option>
                                                </c:if>
                                            </zm:forEachFolder>
                                        </select>
                                    </c:when>
                                    <c:when test="${st eq 'cal' || st eq 'cals' || st eq 'appointment'}">
                                        <input type="hidden" name="parentid" value="${not empty efolder ? efolder.parentId : mailbox.calendar.parentId}"> 
                                    </c:when>
                                    <c:when test="${st eq 'notebook' || st eq 'notebooks' || st eq 'wiki'}">
                                                            <hr size="1"/>
                                        <select name="parentid" style="width:100px;">
                                            <option value="${mailbox.inbox.parentId}">--<fmt:message key="in"/>--
                                            </option>
                                            <zm:forEachFolder var="fldr" skiproot="${false}" skipsystem="${false}"
                                                              skiptrash="${true}">
                                                <c:if test="${fldr.isWikiMoveTarget && (empty efolder || efolder.id ne fldr.id)}">
                                                    <option value="${fldr.id}" ${efolder.parentId eq fldr.id ? 'selected=selected' : ''}>${zm:getFolderPath(pageContext, fldr.id)}</option>
                                                </c:if>
                                            </zm:forEachFolder>

                                        </select>
                                    </c:when>
                                    <c:when test="${st eq 'briefcase' || st eq 'briefcases' || st eq 'document'}">
                                                            <hr size="1"/>
                                        <select name="parentid" style="width:100px;">
                                            <option value="${mailbox.inbox.parentId}">--<fmt:message key="in"/>--
                                            </option>
                                            <zm:forEachFolder var="fldr" skiproot="${false}" skipsystem="${false}"
                                                              skiptrash="${true}">
                                                <c:if test="${fldr.isDocumentMoveTarget && (empty efolder || efolder.id ne fldr.id)}">
                                                    <option value="${fldr.id}" ${fldr.id eq efolder.parentId ? 'selected=selected' : ''}>${zm:getFolderPath(pageContext, fldr.id)}</option>
                                                </c:if>
                                            </zm:forEachFolder>

                                        </select>
                                    </c:when>
                                    <c:when test="${st eq 'task' || st eq 'tasks'}">
                                        <input type="hidden" name="parentid" value="${not empty efolder ? efolder.parentId : mailbox.tasks.parentId}">
                                    </c:when>
                                </c:choose>

                            </div>
                        </div>
                    </div>
                    <c:if test="${not empty efolder}">
                        <hr size="1"/>
                        <div align="center"><input type="submit" class="zo_button delete_button"
                                                   name="action${efolder.parentId eq mailbox.trash.id ? 'Hard' : ''}DeleteFolder"
                                                   value="<fmt:message key="delete"/>"></div>
                    </c:if>
                </form>
            </div>
            <a name="folders" style="padding:0px;margin:0px;"></a>
        </div>
    </div>
</c:when>
<c:when test="${type eq 'search'}">
    <div class="table View" id="nsrchfrm" style="${hide ?'display:none':''};">
        <div class="table-row">
            <div class="table-cell">
                <form action="${url}" method="post"
                      onsubmit="return submitForm(this);">
                    <input type="hidden" name="doFolderAction" value="1">
                    <input name="crumb" type="hidden" value="${fn:escapeXml(mailbox.accountInfo.crumb)}"/>
                    <input name="st" type="hidden" value="${fn:escapeXml(st)}"/>
                    <c:if test="${not empty id}">
                        <c:set var="efolder" value="${zm:getFolder(pageContext, fn:escapeXml(id))}"/>
                        <input type="hidden" name="esearchid" value="${efolder.id}">
                        <input type="hidden" name="parentid" value="${efolder.parentId}">
                    </c:if>
                    <c:if test="${empty id}">
                        <input type="hidden" name="parentid" value="${mailbox.inbox.parentId}">
                    </c:if>

                    <div class="table">
                        <div class="table-row">
                        <span class="label table-cell"> <fmt:message key="nameLabel"/>  <input type="text" name="sname"
                                                                                           style="width:100px;"
                                                                                           class="Textarea"
                                                                                           value="${efolder.name}">
                        <input class="zo_button" type="submit" name="action${empty efolder ? 'Save' : 'Modify'}Search"
                               value="<fmt:message key='save'/>">
                        </span>
                        </div>
                    </div>
                    <hr size="1"/>

                    <div class="table">
                        <div class="table-row">
                                <span class="label table-cell"> <fmt:message key="searchQueryLabel"/> <input type="text"
                                                                                                         name="query"
                                                                                                         style="width:100px;"
                                                                                                         class="Textarea"
                                                                                                         value="${efolder.query}"> </span>
                        </div>
                    </div>
                    <c:if test="${not empty efolder}">
                        <hr size="1"/>
                        <div align="center"><input type="submit" class="zo_button delete_button"
                                                   name="action${efolder.parentId eq mailbox.trash.id ? 'Hard' : ''}DeleteSearch"
                                                   value="<fmt:message key="delete"/>"></div>
                    </c:if>
                </form>
            </div>
            <a name="searches" style="padding:0px;margin:0px;"></a>
        </div>
    </div>

</c:when>
<c:when test="${type eq 'tag'}">
    <div class="table View" id="ntagfrm" style="${hide ? 'display:none' : ''};">
        <div class="table-row">
            <div class="table-cell">
                <form action="${url}" method="post"
                      onsubmit="return submitForm(this);">
                    <input type="hidden" name="doFolderAction" value="1">
                    <input name="crumb" type="hidden" value="${fn:escapeXml(mailbox.accountInfo.crumb)}"/>
                    <c:if test="${not empty id}">
                        <c:set var="etag" value="${zm:getTag(pageContext, fn:escapeXml(id))}"/>
                        <input type="hidden" name="etagid" value="${etag.id}">
                    </c:if>
                    <div class="table">
                        <div class="table-row">
                            <c:if test="${not empty etag}">
                                <span class="SmlIcnHldr Tag${etag.color}">&nbsp;</span>
                            </c:if>
                    <span class="label table-cell"><fmt:message key="nameLabel"/>
                        <input type="text" style="width:100px;" class="Textarea" name="tag_name" value="${etag.name}">
                        <input type="submit" class="zo_button" name="action${empty etag ? 'Save':'Modify'}Tag"
                               value="<fmt:message key='save'/>">
                    </span>
                        </div>
                    </div>
                    <hr size="1"/>
                    <div class="table">
                        <div class="table-row">
                            <div class="table-cell">
                                <select name="tag_color">
                                    <optgroup label="<fmt:message key='color'/>">
                                        <option value="cyan" ${etag.color eq 'cyan' ? 'selected=selected' : ''}>
                                            <fmt:message key="cyan"/></option>
                                        <option value="blue" ${etag.color eq 'blue' ? 'selected=selected' : ''}>
                                            <fmt:message key="blue"/></option>
                                        <option value="purple" ${etag.color eq 'purple' ? 'selected=selected' : ''}>
                                            <fmt:message key="purple"/></option>
                                        <option value="red" ${etag.color eq 'red' ? 'selected=selected' : ''}>
                                            <fmt:message key="red"/></option>
                                        <option value="orange" ${etag.color eq 'orange' ? 'selected=selected' : ''}>
                                            <fmt:message key="orange"/></option>
                                        <option value="yellow ${etag.color eq 'yellow' ? 'selected=selected' : ''}">
                                            <fmt:message key="yellow"/></option>
                                        <option value="green" ${etag.color eq 'green' ? 'selected=selected' : ''}>
                                            <fmt:message key="green"/></option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>
                    </div>
                    <c:if test="${not empty etag}">
                        <hr size="1"/>
                        <div align="center"><input type="submit" class="zo_button delete_button"
                                                   name="actionDeleteTag"
                                                   value="<fmt:message key="delete"/>"></div>
                    </c:if>
                </form>
            </div>
            <a name="tags" style="padding:0px;margin:0px;"></a>
        </div>
    </div>
</c:when>
</c:choose>