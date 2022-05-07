/*

-- additions to the standard database createscript for PostgreSQL
ALTER TABLE public.featureofinterest ALTER COLUMN featureofinterestid SET DEFAULT nextval('featureofinterestid_seq'::regclass);
ALTER TABLE public.featureofinteresttype ALTER COLUMN featureofinteresttypeid SET DEFAULT nextval('featureofinteresttypeid_seq'::regclass);
ALTER TABLE public.observationtype ALTER COLUMN observationtypeid SET DEFAULT nextval('observationtypeid_seq'::regclass);
ALTER TABLE public.observation ALTER COLUMN observationid SET DEFAULT nextval('observationid_seq'::regclass);
ALTER TABLE public.series ALTER COLUMN seriesid SET DEFAULT nextval('seriesid_seq'::regclass);
ALTER TABLE public.relatedfeature ALTER COLUMN relatedfeatureid SET DEFAULT nextval('relatedfeatureid_seq'::regclass);
ALTER TABLE public.observableproperty ALTER COLUMN observablepropertyid SET DEFAULT nextval('observablepropertyid_seq'::regclass);
ALTER TABLE public.offering ALTER COLUMN offeringid SET DEFAULT nextval('offeringid_seq'::regclass);
ALTER TABLE public.procedure ALTER COLUMN procedureid SET DEFAULT nextval('procedureid_seq'::regclass);
ALTER TABLE public.proceduredescriptionformat ALTER COLUMN proceduredescriptionformatid SET DEFAULT nextval('procdescformatid_seq'::regclass);

*/

-- featureofinteresttype
INSERT INTO public.featureofinteresttype (
            -- featureofinteresttypeid -- default value by sequence
            featureofinteresttype )
     VALUES (
            'foitype x'
            );
INSERT INTO public.featureofinteresttype (
            -- featureofinteresttypeid -- default value by sequence
            featureofinteresttype )
     VALUES (
            'foitype City'
            );
INSERT INTO public.featureofinteresttype (
            -- featureofinteresttypeid -- default value by sequence
            featureofinteresttype )
     VALUES (
            'foitype Country'
            );

-- SELECT * FROM public.featureofinteresttype;

INSERT INTO public.featureofinterest ( 
            -- featureofinterestid -- default value by sequence
              hibernatediscriminator
            , featureofinteresttypeid
            , identifier
            , codespace
            , name
            , codespacename
            , description
            , geom
            , descriptionxml
            , url  ) 
     VALUES (
            '?' -- hibernatediscriminator
            , (select featureofinteresttypeid from featureofinteresttype where featureofinteresttype = 'foitype x')
            , '19.cal'  -- identifier
            , null -- codespace (id?)
            , 'Finisterelaan 45'  -- name
            , null -- codespacename (id?) 
            , 'Rand van woonwijk, nabij A2/A50 (meest nabijgelegen rijbaan 104 m tot straatlantaarn (woningen en wal ertussen))' -- description
            , ST_Transform(ST_SetSRID(ST_MakePoint(389159, 158608), 28992), 4326)   --geom fom x/y 28992 into lat/lng 4326
            , null -- descriptionxml
            , null -- url  
            );
INSERT INTO public.featureofinterest ( 
            -- featureofinterestid -- default value by sequence
              hibernatediscriminator
            , featureofinteresttypeid
            , identifier
            , codespace
            , name
            , codespacename
            , description
            , geom
            , descriptionxml
            , url  ) 
     VALUES (
            '?' -- hibernatediscriminator
            , (select featureofinteresttypeid from featureofinteresttype where featureofinteresttype = 'foitype Country')
            , 'Netherlands'  -- identifier
            , null -- codespace (id?)
            , 'Netherlands'  -- name
            , null -- codespacename (id?) 
            , '' -- description
            , ST_Transform(ST_SetSRID(ST_MakePoint(389159, 158608), 28992), 4326)   --geom fom x/y 28992 into lat/lng 4326 --todo must be geometry of country
            , null -- descriptionxml
            , null -- url  
            );
INSERT INTO public.featureofinterest ( 
            -- featureofinterestid -- default value by sequence
              hibernatediscriminator
            , featureofinteresttypeid
            , identifier
            , codespace
            , name
            , codespacename
            , description
            , geom
            , descriptionxml
            , url  ) 
     VALUES (
            '?' -- hibernatediscriminator
            , (select featureofinteresttypeid from featureofinteresttype where featureofinteresttype = 'foitype City')
            , 'Eindhoven'  -- identifier
            , null -- codespace (id?)
            , 'Eindhoven'  -- name
            , null -- codespacename (id?) 
            , '' -- description
            , ST_Transform(ST_SetSRID(ST_MakePoint(389159, 158608), 28992), 4326)   --geom fom x/y 28992 into lat/lng 4326 --todo must be geometry of city
            , null -- descriptionxml
            , null -- url  
            );
INSERT INTO public.featureofinterest ( 
            -- featureofinterestid -- default value by sequence
              hibernatediscriminator
            , featureofinteresttypeid
            , identifier
            , codespace
            , name
            , codespacename
            , description
            , geom
            , descriptionxml
            , url  ) 
     VALUES (
            '?' -- hibernatediscriminator
            , (select featureofinteresttypeid from featureofinteresttype where featureofinteresttype = 'foitype City')
            , 'Breda'  -- identifier
            , null -- codespace (id?)
            , 'Breda'  -- name
            , null -- codespacename (id?) 
            , '' -- description
            , ST_Transform(ST_SetSRID(ST_MakePoint(389159, 158608), 28992), 4326)   --geom fom x/y 28992 into lat/lng 4326 --todo must be geometry of city
            , null -- descriptionxml
            , null -- url  
            );
INSERT INTO public.featureofinterest ( 
            -- featureofinterestid -- default value by sequence
              hibernatediscriminator
            , featureofinteresttypeid
            , identifier
            , codespace
            , name
            , codespacename
            , description
            , geom
            , descriptionxml
            , url  ) 
     VALUES (
            '?' -- hibernatediscriminator
            , (select featureofinteresttypeid from featureofinteresttype where featureofinteresttype = 'foitype City')
            , 'Helmond'  -- identifier
            , null -- codespace (id?)
            , 'Helmond'  -- name
            , null -- codespacename (id?) 
            , '' -- description
            , ST_Transform(ST_SetSRID(ST_MakePoint(389159, 158608), 28992), 4326)   --geom fom x/y 28992 into lat/lng 4326 --todo must be geometry of city
            , null -- descriptionxml
            , null -- url  
            );

-- SELECT * FROM public.featureofinterest;

/*
observationtype
For a particular constellation of procedure, observedProperty and ObservationOffering, observations shall always be encoded in the same observationType . The InsertObservation operation shall check whether a differing observationType is inserted for the same constellation of procedure, observedProperty and ObservationOffering that was inserted before.
*/
INSERT INTO public.observationtype (
            -- observationtypeid -- default value by sequence
            observationtype )
     VALUES (
            'http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Observation'
            );
INSERT INTO public.observationtype (
            -- observationtypeid -- default value by sequence
            observationtype )
     VALUES (
            'http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement'
            );
			

-- SELECT * FROM public.observationtype;



-- proceduredescriptionformat
INSERT INTO public.proceduredescriptionformat (
            -- proceduredescriptionformatid -- default value by sequence
            proceduredescriptionformat )
     VALUES (
            'procdescformat x'
            );

INSERT INTO public.procedure(
            -- procedureid -- default value by sequence
			hibernatediscriminator
			, proceduredescriptionformatid
			, identifier
			, codespace
			, name
			, codespacename
			, description
			--, deleted -- default 'F' false
			, descriptionfile
			, referenceflag)
    VALUES ('?' -- hibernatediscriminator
	        , (select proceduredescriptionformatid from public.proceduredescriptionformat where proceduredescriptionformat = 'procdescformat x')
			, 'proc_0001' -- identifier
			, null -- codespace
			, 'procedurename 0001'
			, null --codespacename
			, 'description....'
			-- deleted -- defaults value 'F' false
			, null --descriptionfile
            , null --referenceflag
			);


/*
observableproperty
*/
INSERT INTO public.observableproperty(
             -- observablepropertyid -- default value by sequence
			  hibernatediscriminator
			, identifier
			, codespace
			, name
			, codespacename
			, description
			)
    VALUES ('?'  -- hibernatediscriminator
            , 'ID1234'
			, null
			, null
			, null
			, null
			);
INSERT INTO public.observableproperty(
             -- observablepropertyid -- default value by sequence
			  hibernatediscriminator
			, identifier
			, codespace
			, name
			, codespacename
			, description
			)
    VALUES ('?'  -- hibernatediscriminator
            , 'http://giv-genesis.uni-muenster.de:8080/SOR/REST/phenomenon/OGC/Concentration[SO2]'
			, null
			, null
			, null
			, null
			);


			
/*
series
*/
INSERT INTO public.series(
            -- seriesid -- default value by sequence
			  featureofinterestid
			, observablepropertyid
			, procedureid 
            -- , deleted -- defaults value 'F' false
			-- , published -- defaults value 'T' true
			, firsttimestamp
			, lasttimestamp
			, firstnumericvalue
			, lastnumericvalue
			, unitid)
    VALUES ((select featureofinterestid from featureofinterest where identifier = '19.cal') 
			, (select observablepropertyid from public.observableproperty where identifier = 'ID1234') -- observablepropertyid
			, (select procedureid from public.procedure where identifier = 'proc_0001') -- procedureid
            , null -- firsttimestamp 
			, null -- lasttimestamp
			, null -- firstnumericvalue
			, null -- lastnumericvalue
			, null -- unitid
			);
INSERT INTO public.series(
            -- seriesid -- default value by sequence
			  featureofinterestid
			, observablepropertyid
			, procedureid 
            -- , deleted -- defaults value 'F' false
			-- , published -- defaults value 'T' true
			, firsttimestamp
			, lasttimestamp
			, firstnumericvalue
			, lastnumericvalue
			, unitid)
    VALUES ((select featureofinterestid from featureofinterest where identifier = 'Netherlands') 
			, (select observablepropertyid from public.observableproperty where identifier = 'http://giv-genesis.uni-muenster.de:8080/SOR/REST/phenomenon/OGC/Concentration[SO2]') -- observablepropertyid
			, (select procedureid from public.procedure where identifier = 'proc_0001') -- procedureid
            , null -- firsttimestamp 
			, null -- lasttimestamp
			, null -- firstnumericvalue
			, null -- lastnumericvalue
			, null -- unitid
			);
INSERT INTO public.series(
            -- seriesid -- default value by sequence
			  featureofinterestid
			, observablepropertyid
			, procedureid 
            -- , deleted -- defaults value 'F' false
			-- , published -- defaults value 'T' true
			, firsttimestamp
			, lasttimestamp
			, firstnumericvalue
			, lastnumericvalue
			, unitid)
    VALUES ((select featureofinterestid from featureofinterest where identifier = 'Eindhoven') 
			, (select observablepropertyid from public.observableproperty where identifier = 'http://giv-genesis.uni-muenster.de:8080/SOR/REST/phenomenon/OGC/Concentration[SO2]') -- observablepropertyid
			, (select procedureid from public.procedure where identifier = 'proc_0001') -- procedureid
            , null -- firsttimestamp 
			, null -- lasttimestamp
			, null -- firstnumericvalue
			, null -- lastnumericvalue
			, null -- unitid
			);


/*
observation
*/

INSERT INTO public.observation(
            -- observationid -- default value by sequence
			  seriesid
			, phenomenontimestart
			, phenomenontimeend
			, resulttime
			, identifier
			, codespace
			, name
			, codespacename
			, description
			-- , deleted -- default value 'F' false
			, validtimestart
			, validtimeend
			, unitid
			, samplinggeometry
			)
    VALUES (
			(select ser.seriesid from series ser, featureofinterest foi where foi.identifier = '19.cal' and foi.featureofinterestid = ser.featureofinterestid) -- seriesid
			, '2015-07-20T0:0:0.00Z' -- phenomenontimestart
			, '2015-07-20T0:0:0.00Z' -- phenomenontimeend 
            , '2015-07-20T0:0:0.00Z' -- resulttime
			, 'obs_20150718_0001' -- identifier
			, null -- codespace
			, null -- name
			, null -- codespacename
			, null -- description 
			, null -- validtimestart
			, null -- validtimeend 
			, null -- unitid
			, null -- samplinggeometry
			);

INSERT INTO public.offering(
            -- offeringid -- default value by sequence
			  hibernatediscriminator
			, identifier
			, codespace
			, name
			, codespacename
			, description
			)
    VALUES ('?' -- hibernatediscriminator
	        , 'offer_0001' -- identifier
			, null --codespace
			, 'Offering 1'
			, null -- codespacename
			, '...' -- description
			);

INSERT INTO public.observationhasoffering(
              observationid
			, offeringid)
    VALUES (
	        (select observationid from public.observation where identifier = 'obs_20150718_0001')
			, (select offeringid from public.offering where identifier = 'offer_0001')
		   );


INSERT INTO public.relatedfeature(
            -- relatedfeatureid -- default value by sequence
			featureofinterestid)
    VALUES (
           (select featureofinterestid from public.featureofinterest where identifier = '19.cal') 	
           );
INSERT INTO public.relatedfeature(
            -- relatedfeatureid -- default value by sequence
			featureofinterestid)
    VALUES (
           (select featureofinterestid from public.featureofinterest where identifier = 'Netherlands') 	
           );
INSERT INTO public.relatedfeature(
            -- relatedfeatureid -- default value by sequence
			featureofinterestid)
    VALUES (
           (select featureofinterestid from public.featureofinterest where identifier = 'Eindhoven') 	
           );		   
INSERT INTO public.relatedfeature(
            -- relatedfeatureid -- default value by sequence
			featureofinterestid)
    VALUES (
           (select featureofinterestid from public.featureofinterest where identifier = 'Breda') 	
           );
INSERT INTO public.relatedfeature(
            -- relatedfeatureid -- default value by sequence
			featureofinterestid)
    VALUES (
           (select featureofinterestid from public.featureofinterest where identifier = 'Helmond') 	
           );		   
	

INSERT INTO public.offeringhasrelatedfeature(
              relatedfeatureid
			, offeringid)
    VALUES (
	        (select relfoi.relatedfeatureid from public.relatedfeature relfoi, public.featureofinterest foi where relfoi.featureofinterestid = foi.featureofinterestid AND foi.identifier = '19.cal')
			, (select offeringid from public.offering where identifier = 'offer_0001')
		   );




/*

cleanup

DELETE FROM public.featureofinterest;
DELETE FROM public.featureofinteresttype;
DELETE FROM public.observation;
DELETE FROM public.offering;
DELETE FROM public.observationtype;
DELETE FROM public.observationhasoffering;
DELETE FROM public.procedure;
DELETE FROM public.relatedfeature;
DELETE FROM public.offeringhasrelatedfeature;
DELETE FROM public.proceduredescriptionformat;
DELETE FROM public.series;
DELETE FROM public.observableproperty


*/

