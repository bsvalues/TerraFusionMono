
CREATE PROCEDURE [dbo].[InsertRemovedActivity]	@WorkflowInstanceInternalId		bigint
												,@WorkflowInstanceEventId		bigint
												,@QualifiedName					nvarchar(128)
												,@ParentQualifiedName			nvarchar(128) 	= NULL
												,@RemovedActivityAction			nvarchar(2000)	= NULL
												,@Order							int				= NULL
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	DECLARE @error			int
			,@error_desc	nvarchar(256)
			,@ret			int
			,@rowcount		int

	declare @localized_string_InsertRemovedActivity_Failed_RemovedInsert nvarchar(256)
	set @localized_string_InsertRemovedActivity_Failed_RemovedInsert = N'InsertRemovedActivity failed inserting in RemovedActivity'

	INSERT	[dbo].[RemovedActivity] (
		[WorkflowInstanceInternalId]
		,[WorkflowInstanceEventId]
		,[QualifiedName]
		,[ParentQualifiedName]
		,[RemovedActivityAction]
		,[Order]
	) VALUES (
		@WorkflowInstanceInternalId
		,@WorkflowInstanceEventId
		,@QualifiedName
		,@ParentQualifiedName
		,@RemovedActivityAction
		,@Order
	)

	SELECT @error = @@ERROR, @rowcount = @@ROWCOUNT

	IF @error IS NULL OR @error <> 0 OR @rowcount IS NULL OR @rowcount <> 1
	 BEGIN
		SELECT @error_desc = @localized_string_InsertRemovedActivity_Failed_RemovedInsert
		GOTO FAILED
	 END



	SET @ret = 0
	GOTO DONE

FAILED:
	RAISERROR( @error_desc, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:
	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[InsertRemovedActivity] TO [tracking_writer]
    AS [dbo];


GO

