
CREATE PROCEDURE [dbo].[InsertTrackingDataItemAnnotationMultiple]	@WorkflowInstanceInternalId		bigint																	
																	,@HasData1						bit
																	,@TrackingDataItemId1			bigint
																	,@Annotation1					nvarchar(1024)	= NULL
																	,@HasData2						bit				= NULL
																	,@TrackingDataItemId2			bigint			= NULL
																	,@Annotation2					nvarchar(1024)	= NULL
																	,@HasData3						bit				= NULL
																	,@TrackingDataItemId3			bigint			= NULL
																	,@Annotation3					nvarchar(1024)	= NULL
																	,@HasData4						bit				= NULL
																	,@TrackingDataItemId4			bigint			= NULL
																	,@Annotation4					nvarchar(1024)	= NULL
																	,@HasData5						bit				= NULL
																	,@TrackingDataItemId5			bigint			= NULL
																	,@Annotation5					nvarchar(1024)	= NULL
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	DECLARE @local_tran		bit
			,@error			int
			,@error_desc	nvarchar(256)
			,@ret			smallint

	IF @@TRANCOUNT > 0
		SET @local_tran = 0
	ELSE
	 BEGIN
		BEGIN TRANSACTION
		SET @local_tran = 1		
	 END

	IF @HasData1 IS NOT NULL AND @HasData1 = 1
	 BEGIN
		EXEC @ret = [dbo].[InsertTrackingDataItemAnnotation]	@TrackingDataItemId				= @TrackingDataItemId1
																,@WorkflowInstanceInternalId	= @WorkflowInstanceInternalId
																,@Annotation					= @Annotation1

		IF @@ERROR IS NULL OR @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0
			GOTO FAILED	
	 END

	IF @HasData2 IS NOT NULL AND @HasData2 = 1
	 BEGIN
		EXEC @ret = [dbo].[InsertTrackingDataItemAnnotation]	@TrackingDataItemId				= @TrackingDataItemId2
																,@WorkflowInstanceInternalId	= @WorkflowInstanceInternalId
																,@Annotation					= @Annotation2

		IF @@ERROR IS NULL OR @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0
			GOTO FAILED	
	 END

	IF @HasData3 IS NOT NULL AND @HasData3 = 1
	 BEGIN
		EXEC @ret = [dbo].[InsertTrackingDataItemAnnotation]	@TrackingDataItemId				= @TrackingDataItemId3
																,@WorkflowInstanceInternalId	= @WorkflowInstanceInternalId
																,@Annotation					= @Annotation3

		IF @@ERROR IS NULL OR @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0
			GOTO FAILED	
	 END

	IF @HasData4 IS NOT NULL AND @HasData4 = 1
	 BEGIN
		EXEC @ret = [dbo].[InsertTrackingDataItemAnnotation]	@TrackingDataItemId				= @TrackingDataItemId4
																,@WorkflowInstanceInternalId	= @WorkflowInstanceInternalId
																,@Annotation					= @Annotation4

		IF @@ERROR IS NULL OR @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0
			GOTO FAILED	
	 END

	IF @HasData5 IS NOT NULL AND @HasData5 = 1
	 BEGIN
		EXEC @ret = [dbo].[InsertTrackingDataItemAnnotation]	@TrackingDataItemId				= @TrackingDataItemId5
																,@WorkflowInstanceInternalId	= @WorkflowInstanceInternalId
																,@Annotation					= @Annotation5

		IF @@ERROR IS NULL OR @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0
			GOTO FAILED	
	 END



	IF @local_tran = 1
		COMMIT TRANSACTION

	SET @ret = 0
	GOTO DONE

FAILED:
	SET @ret = -1

	IF @local_tran = 1
		ROLLBACK TRANSACTION

	RAISERROR( @error_desc, 16, -1 )

	GOTO DONE

DONE:
	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[InsertTrackingDataItemAnnotationMultiple] TO [tracking_writer]
    AS [dbo];


GO

