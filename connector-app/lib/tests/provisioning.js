Tests["provisioning"]=function (ctx) {
    return SKIP;

    var provisioning = Modules.include("provisioning").init(
        ctx.controller,
        ctx.config.iot_repo_url,
        ctx.config.auth_url,
        ctx.config.user,
        ctx.config.password);

    provisioning.run(function (changed) {

    });

    return null;
};
