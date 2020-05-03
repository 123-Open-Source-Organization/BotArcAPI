export default (userinfos: IArcPlayer): Promise<Array<void>> => {

  // always pack object to array
  let _wrapper: Array<IArcPlayer>;

  if (userinfos instanceof Array)
    _wrapper = userinfos;
  else
    _wrapper = [userinfos];

  // enum data and insert them
  const _promises: Array<Promise<void>> =
    _wrapper.map((element) => {

      const _sqlbinding: IDatabaseArcPlayer = {
        uid: element.user_id,
        code: element.code,
        name: element.name,
        ptt: element.rating,
        join_date: element.join_date,
      };

      // this user ptt is hidden
      if (element.rating == -1)
        delete _sqlbinding.ptt;

      const _sql =
        `INSERT OR REPLACE INTO ` +
        `\`players\`(${Object.keys(_sqlbinding).join()}) ` +
        `VALUES(${new Array(Object.keys(_sqlbinding).length).fill('?').join(',')});`;

      // execute sql
      return DATABASE_ARCPLAYER.run(_sql, Object.values(_sqlbinding));

    });

  return Promise.all(_promises);

}
