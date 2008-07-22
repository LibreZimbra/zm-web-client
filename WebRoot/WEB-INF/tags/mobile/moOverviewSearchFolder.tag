<%@ tag body-content="empty" %>
<%@ attribute name="folder" rtexprvalue="true" required="true" type="com.zimbra.cs.taglib.bean.ZFolderBean" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="fmt" uri="com.zimbra.i18n" %>
<%@ taglib prefix="mo" uri="com.zimbra.mobileclient" %>
<%@ taglib prefix="zm" uri="com.zimbra.zm" %>
<c:set var="label" value="${zm:getFolderName(pageContext, folder.id)}"/>
<c:set var="context_url" value="${requestScope.baseURL!=null?requestScope.baseURL:'/m/mosearch'}"/>
<tr onclick='zClickLink("FLDR${folder.id}")'>
    <c:set var="url" value="${context_url}?sfi=${folder.id}"/>
    <td class='Folders zo_m_list_row' style='padding:5px;'>
        <a id="FLDR${folder.id}" href="${fn:escapeXml(url)}">
            <mo:img alt='${fn:escapeXml(label)}' src="${folder.image}"/>
            ${fn:escapeXml(label)}
        </a>
    </td>
</tr>
