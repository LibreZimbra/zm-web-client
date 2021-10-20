# SPDX-License-Identifier: AGPL-3.0-or-later

ANT_TARGET = $(ANT_ARG_BUILDINFO) -Dajax.dir=$(ZIMBRA_PREFIX)/include/zm-ajax clean-pkg prod-war jspc.build

all: build-ant

include build.mk

install:
	$(call mk_install_dir, jetty_base/webapps/zimbra)
	$(call mk_install_dir, jetty_base/etc)

	cd $(INSTALL_DIR)/jetty_base/webapps/zimbra && jar -xf $(CURDIR)/build/dist/jetty/webapps/zimbra.war
	cp -R WebRoot/templates $(INSTALL_DIR)/conf
	cp -R $(CURDIR)/build/dist/jetty/work $(INSTALL_DIR)/jetty_base
	cp WebRoot/WEB-INF/jetty-env.xml $(INSTALL_DIR)/zimbra-jetty-env.xml.in
	cat build/web.xml \
		| sed -e '/REDIRECTBEGIN/ s/\$$/ %%comment VAR:zimbraMailMode,-->,redirect%%/' \
		      -e '/REDIRECTEND/ s/^/%%comment VAR:zimbraMailMode,<!--,redirect%% /' \
		> $(INSTALL_DIR)/jetty_base/etc/zimbra.web.xml.in

clean: clean-ant
