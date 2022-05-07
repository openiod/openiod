delete from categoryvalue cv
where cv.observationid in 
(select observationid from observation
where seriesid in (
	select distinct(s.seriesid) 
	from series s,
	procedure p
	where p.procedureid = s.procedureid
	and p.identifier = 'http://wiki.aireas.com/index.php/humansensor_standard_procedure')
)

delete from observationhasoffering oo
where oo.observationid in 
(select observationid from observation
where seriesid in (
	select distinct(s.seriesid) 
	from series s,
	procedure p
	where p.procedureid = s.procedureid
	and p.identifier = 'http://wiki.aireas.com/index.php/humansensor_standard_procedure')
)


delete from observation
where seriesid in (
	select distinct(s.seriesid) 
	from series s,
	procedure p
	where p.procedureid = s.procedureid
	and p.identifier = 'http://wiki.aireas.com/index.php/humansensor_standard_procedure')

delete from series
where seriesid in (
	select distinct(s.seriesid) 
	from series s,
	procedure p
	where p.procedureid = s.procedureid
	and p.identifier = 'http://wiki.aireas.com/index.php/humansensor_standard_procedure')
	