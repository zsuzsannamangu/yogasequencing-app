from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import json
from datetime import datetime
from app.database import database
from app.auth import get_current_user_id

router = APIRouter(prefix="/sequences", tags=["sequences"])
security = HTTPBearer()

# Pydantic models
class PoseData(BaseModel):
    filePath: str
    poseName: str

class SequenceCreate(BaseModel):
    name: str
    description: str
    duration: str
    poseCount: int
    poses: List[PoseData]
    category: Optional[str] = None
    privacy: Optional[str] = 'private'
    industryLabel: Optional[str] = 'Yoga'

class UserInfo(BaseModel):
    id: str
    first_name: str
    last_name: str
    profile_image: Optional[str] = None
    business_name: Optional[str] = None

class SequenceResponse(BaseModel):
    id: str
    name: str
    description: str
    duration: str
    poseCount: int
    poses: List[PoseData]
    createdAt: str
    category: Optional[str] = None
    privacy: Optional[str] = 'private'
    industryLabel: Optional[str] = 'Yoga'
    user: Optional[UserInfo] = None

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    createdAt: str

# Category endpoints
@router.post("/categories/", response_model=CategoryResponse)
async def create_category(category: CategoryCreate):
    """Create a new category"""
    query = """
        INSERT INTO categories (name, description, created_at)
        VALUES (:name, :description, :created_at)
        RETURNING id, name, description, created_at
    """
    values = {
        "name": category.name,
        "description": category.description,
        "created_at": datetime.now()
    }
    
    try:
        result = await database.fetch_one(query, values)
        return CategoryResponse(
            id=str(result["id"]),
            name=result["name"],
            description=result["description"],
            createdAt=result["created_at"].isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(e)}")

@router.get("/categories/", response_model=List[CategoryResponse])
async def get_categories():
    """Get all categories"""
    query = "SELECT id, name, description, created_at FROM categories ORDER BY name"
    
    try:
        results = await database.fetch_all(query)
        return [
            CategoryResponse(
                id=str(result["id"]),
                name=result["name"],
                description=result["description"],
                createdAt=result["created_at"].isoformat()
            )
            for result in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")

@router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    """Delete a category if it has no sequences"""
    # First check if category exists
    check_query = "SELECT id FROM categories WHERE id = :id"
    category = await database.fetch_one(check_query, {"id": category_id})
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if any sequences are using this category
    sequences_query = "SELECT id FROM sequences WHERE category = :category_id"
    sequences = await database.fetch_all(sequences_query, {"category_id": category_id})
    
    if sequences:
        raise HTTPException(status_code=400, detail="Cannot delete category that has sequences")
    
    # Delete the category
    delete_query = "DELETE FROM categories WHERE id = :id"
    try:
        await database.execute(delete_query, {"id": category_id})
        return {"message": "Category deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete category: {str(e)}")

# Sequence endpoints
@router.post("/", response_model=SequenceResponse)
async def create_sequence(
    sequence: SequenceCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create a new sequence"""
    try:
        # Get current user ID from JWT token
        user_id = get_current_user_id(credentials.credentials)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid or missing authentication token")
        
        # Debug logging
        print(f"Creating sequence for user: {user_id}")
        print(f"Industry Label: {sequence.industryLabel}")
        print(f"Number of poses: {len(sequence.poses)}")
        print(f"Sequence name: {sequence.name}")
        print(f"Sequence description length: {len(sequence.description) if sequence.description else 0}")
        
        # Validate sequence data
        if not sequence.name or not sequence.name.strip():
            raise HTTPException(status_code=400, detail="Sequence name is required")
        
        if len(sequence.name) > 255:
            raise HTTPException(status_code=400, detail="Sequence name is too long")
        
        if sequence.description and len(sequence.description) > 10000:
            raise HTTPException(status_code=400, detail="Sequence description is too long")
        
        # Check if poses data is too large and validate pose data
        validated_poses = []
        for i, pose in enumerate(sequence.poses):
            # Clean filePath
            file_path = pose.filePath.split('/').pop() if '/' in pose.filePath else pose.filePath
            # Clean pose name (remove any problematic characters)
            pose_name = pose.poseName.strip() if pose.poseName else f"Pose {i+1}"
            
            validated_poses.append({
                "filePath": file_path,
                "poseName": pose_name
            })
        
        poses_json = json.dumps(validated_poses)
        
        poses_size = len(poses_json)
        print(f"Pose data size: {poses_size} characters")
        
        # If poses data is too large (>1MB), truncate it
        if poses_size > 1000000:  # 1MB limit
            print(f"WARNING: Pose data too large ({poses_size} chars), truncating to first 100 poses")
            truncated_poses = validated_poses[:100]  # Keep only first 100 poses
            poses_json = json.dumps(truncated_poses)
            print(f"Truncated pose data size: {len(poses_json)} characters")
            
            # Update pose count to reflect truncation
            sequence.poseCount = len(truncated_poses)
        
        # Generate unique ID (use absolute value of hash to avoid negative numbers)
        sequence_id = f"seq_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{abs(hash(sequence.name))}"
        
        # Save to database - handle missing columns gracefully
        try:
            # Try with all columns first (including user_id)
            query = """
            INSERT INTO sequences (id, name, description, duration, pose_count, poses, created_at, user_id, category, privacy, industry_label)
            VALUES (:id, :name, :description, :duration, :pose_count, :poses, :created_at, :user_id, :category, :privacy, :industry_label)
            """
            
            await database.execute(
                query,
                {
                    "id": sequence_id,
                    "name": sequence.name,
                    "description": sequence.description,
                    "duration": sequence.duration,
                    "pose_count": sequence.poseCount,
                    "poses": poses_json,
                    "created_at": datetime.now(),
                    "user_id": user_id,
                    "category": sequence.category,
                    "privacy": sequence.privacy,
                    "industry_label": sequence.industryLabel
                }
            )
        except Exception as e:
            try:
                # Fallback to insert without industry_label column (but with user_id)
                query = """
                INSERT INTO sequences (id, name, description, duration, pose_count, poses, created_at, user_id, category, privacy)
                VALUES (:id, :name, :description, :duration, :pose_count, :poses, :created_at, :user_id, :category, :privacy)
                """
                
                await database.execute(
                    query,
                    {
                        "id": sequence_id,
                        "name": sequence.name,
                        "description": sequence.description,
                        "duration": sequence.duration,
                        "pose_count": sequence.poseCount,
                        "poses": poses_json,
                        "created_at": datetime.now(),
                        "user_id": user_id,
                        "category": sequence.category,
                        "privacy": sequence.privacy
                    }
                )
            except Exception as e2:
                # Final fallback to insert without privacy and industry_label columns (but with user_id)
                query = """
                INSERT INTO sequences (id, name, description, duration, pose_count, poses, created_at, user_id, category)
                VALUES (:id, :name, :description, :duration, :pose_count, :poses, :created_at, :user_id, :category)
                """
                
                await database.execute(
                    query,
                    {
                        "id": sequence_id,
                        "name": sequence.name,
                        "description": sequence.description,
                        "duration": sequence.duration,
                        "pose_count": sequence.poseCount,
                        "poses": poses_json,
                        "created_at": datetime.now(),
                        "user_id": user_id,
                        "category": sequence.category
                    }
                )
        
        # Prepare response
        response = SequenceResponse(
            id=sequence_id,
            name=sequence.name,
            description=sequence.description,
            duration=sequence.duration,
            poseCount=sequence.poseCount,
            poses=sequence.poses,
            createdAt=datetime.now().isoformat(),
            category=sequence.category,
            privacy=sequence.privacy if hasattr(sequence, 'privacy') else "private",
            industryLabel=sequence.industryLabel if hasattr(sequence, 'industryLabel') else "Yoga"
        )
        
        # Add warning if poses were truncated
        if poses_size > 1000000:
            print(f"Returning sequence with {len(sequence.poses)} poses (truncated from original)")
        
        return response
        
    except Exception as e:
        print(f"Database error: {str(e)}")
        print(f"Error type: {type(e)}")
        print(f"Sequence data that failed: {sequence.dict()}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        
        # Provide more specific error messages
        error_detail = str(e)
        if "duplicate key" in error_detail.lower():
            error_detail = "Sequence with this name already exists"
        elif "connection" in error_detail.lower():
            error_detail = "Database connection error"
        elif "permission" in error_detail.lower():
            error_detail = "Database permission error"
            
        raise HTTPException(status_code=500, detail=f"Failed to create sequence: {error_detail}")

@router.get("/", response_model=List[SequenceResponse])
async def get_sequences(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get user's own sequences (both public and private)"""
    try:
        # Get current user ID from JWT token
        user_id = get_current_user_id(credentials.credentials)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid or missing authentication token")
        
        # Get ONLY the user's own sequences (both public and private)
        query = """
        SELECT * FROM sequences 
        WHERE user_id = :user_id
        ORDER BY created_at DESC
        """
        result = await database.fetch_all(query, {"user_id": user_id})
        
        sequences = []
        for row in result:
            # Parse poses JSON back to list
            poses_data = json.loads(row["poses"]) if row["poses"] else []
            poses = [PoseData(**pose) for pose in poses_data]
            
            sequences.append(SequenceResponse(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                duration=row["duration"],
                poseCount=row["pose_count"],
                poses=poses,
                createdAt=row["created_at"].isoformat() if row["created_at"] else None,
                category=row["category"] if "category" in row else None,
                privacy=row["privacy"] if "privacy" in row else "private",
                industryLabel=row["industry_label"] if "industry_label" in row else "Yoga"
            ))
        
        return sequences
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve sequences: {str(e)}")

@router.get("/public/", response_model=List[SequenceResponse])
async def get_public_sequences():
    """Get only public sequences with user information"""
    try:
        query = """
        SELECT s.*, u.id as user_id, u.first_name, u.last_name, u.profile_image, u.business_name
        FROM sequences s
        JOIN users u ON s.user_id = u.id
        WHERE s.privacy = 'public' 
        ORDER BY s.created_at DESC
        """
        result = await database.fetch_all(query)
        
        sequences = []
        for row in result:
            # Parse poses JSON back to list
            poses_data = json.loads(row["poses"]) if row["poses"] else []
            poses = [PoseData(**pose) for pose in poses_data]
            
            # Create user info
            user_info = UserInfo(
                id=row["user_id"],
                first_name=row["first_name"],
                last_name=row["last_name"],
                profile_image=row["profile_image"],
                business_name=row["business_name"]
            )
            
            sequences.append(SequenceResponse(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                duration=row["duration"],
                poseCount=row["pose_count"],
                poses=poses,
                createdAt=row["created_at"].isoformat() if row["created_at"] else None,
                category=row["category"] if "category" in row else None,
                privacy=row["privacy"] if "privacy" in row else "public",
                industryLabel=row["industry_label"] if "industry_label" in row else "Yoga",
                user=user_info
            ))
        
        return sequences
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve public sequences: {str(e)}")

@router.get("/my-download-stats")
async def get_my_download_stats(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get download statistics for the authenticated user's public sequences from browse page"""
    try:
        # Get current user ID
        user_id = get_current_user_id(credentials.credentials)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid or missing authentication token")
        
        # Count downloads of user's public sequences from browse page only
        # Excludes downloads by the user themselves
        query = """
        SELECT COUNT(*) as download_count
        FROM downloads d
        JOIN sequences s ON d.sequence_id = s.id
        WHERE s.user_id = :user_id 
        AND s.privacy = 'public'
        AND d.download_source = 'browse'
        AND (d.downloaded_by_user_id IS NULL OR d.downloaded_by_user_id != :user_id)
        """
        
        result = await database.fetch_one(query, {"user_id": user_id})
        return {"total_downloads": result["download_count"] if result else 0}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get download stats: {str(e)}")

@router.get("/{sequence_id}", response_model=SequenceResponse)
async def get_sequence(sequence_id: str):
    """Get a specific sequence by ID with user information"""
    try:
        query = """
        SELECT s.*, u.id as user_id, u.first_name, u.last_name, u.profile_image, u.business_name
        FROM sequences s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = :id
        """
        result = await database.fetch_one(query, {"id": sequence_id})
        
        if not result:
            raise HTTPException(status_code=404, detail="Sequence not found")
        
        # Parse poses JSON back to list
        poses_data = json.loads(result["poses"]) if result["poses"] else []
        poses = [PoseData(**pose) for pose in poses_data]
        
        # Create user info
        user_info = UserInfo(
            id=result["user_id"],
            first_name=result["first_name"],
            last_name=result["last_name"],
            profile_image=result["profile_image"],
            business_name=result["business_name"]
        )
        
        return SequenceResponse(
            id=result["id"],
            name=result["name"],
            description=result["description"],
            duration=result["duration"],
            poseCount=result["pose_count"],
            poses=poses,
            createdAt=result["created_at"].isoformat() if result["created_at"] else None,
            category=result["category"] if "category" in result else None,
            privacy=result["privacy"] if "privacy" in result else "private",
            industryLabel=result["industry_label"] if "industry_label" in result else "Yoga",
            user=user_info
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve sequence: {str(e)}")

@router.get("/debug/schema/", response_model=dict)
async def get_database_schema():
    """Debug endpoint to check database schema"""
    try:
        # Check if industry_label column exists
        query = """
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'sequences' 
        ORDER BY ordinal_position;
        """
        result = await database.fetch_all(query)
        
        columns = {}
        for row in result:
            columns[row["column_name"]] = {
                "type": row["data_type"],
                "nullable": row["is_nullable"],
                "default": row["column_default"]
            }
        
        return {"table": "sequences", "columns": columns}
        
    except Exception as e:
        return {"error": str(e)}

@router.get("/industry-labels/", response_model=List[str])
async def get_available_industry_labels():
    """Get all available industry labels"""
    try:
        query = "SELECT DISTINCT industry_label FROM sequences WHERE industry_label IS NOT NULL ORDER BY industry_label"
        result = await database.fetch_all(query)
        
        labels = [row["industry_label"] for row in result]
        return labels
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve industry labels: {str(e)}")

@router.get("/by-industry/{industry_label}", response_model=List[SequenceResponse])
async def get_sequences_by_industry(industry_label: str):
    """Get sequences filtered by industry label"""
    try:
        query = "SELECT * FROM sequences WHERE industry_label = :industry_label ORDER BY created_at DESC"
        result = await database.fetch_all(query, {"industry_label": industry_label})
        
        sequences = []
        for row in result:
            # Parse poses JSON back to list
            poses_data = json.loads(row["poses"]) if row["poses"] else []
            poses = [PoseData(**pose) for pose in poses_data]
            
            sequences.append(SequenceResponse(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                duration=row["duration"],
                poseCount=row["pose_count"],
                poses=poses,
                createdAt=row["created_at"].isoformat() if row["created_at"] else None,
                category=row["category"] if "category" in row else None,
                privacy=row["privacy"] if "privacy" in row else "private",
                industryLabel=row["industry_label"] if "industry_label" in row else "Yoga"
            ))
        
        return sequences
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve sequences by industry: {str(e)}")

@router.put("/{sequence_id}", response_model=SequenceResponse)
async def update_sequence(sequence_id: str, sequence: SequenceCreate):
    """Update an existing sequence"""
    try:
        # First check if sequence exists
        check_query = "SELECT id FROM sequences WHERE id = :id"
        existing = await database.fetch_one(check_query, {"id": sequence_id})
        
        if not existing:
            raise HTTPException(status_code=404, detail="Sequence not found")
        
        # Update the sequence
        try:
            # Try with all columns first
            query = """
            UPDATE sequences 
            SET name = :name, description = :description, duration = :duration, 
                pose_count = :pose_count, poses = :poses, category = :category, 
                privacy = :privacy, industry_label = :industry_label
            WHERE id = :id
            """
            
            await database.execute(
                query,
                {
                    "id": sequence_id,
                    "name": sequence.name,
                    "description": sequence.description,
                    "duration": sequence.duration,
                    "pose_count": sequence.poseCount,
                    "poses": json.dumps([pose.dict() for pose in sequence.poses]),
                    "category": sequence.category,
                    "privacy": sequence.privacy,
                    "industry_label": sequence.industryLabel
                }
            )
        except Exception as e:
            # Fallback to update without industry_label column
            query = """
            UPDATE sequences 
            SET name = :name, description = :description, duration = :duration, 
                pose_count = :pose_count, poses = :poses, category = :category, 
                privacy = :privacy
            WHERE id = :id
            """
            
            await database.execute(
                query,
                {
                    "id": sequence_id,
                    "name": sequence.name,
                    "description": sequence.description,
                    "duration": sequence.duration,
                    "pose_count": sequence.poseCount,
                    "poses": json.dumps([pose.dict() for pose in sequence.poses]),
                    "category": sequence.category,
                    "privacy": sequence.privacy
                }
            )
        
        # Fetch and return the updated sequence
        updated_query = "SELECT * FROM sequences WHERE id = :id"
        result = await database.fetch_one(updated_query, {"id": sequence_id})
        
        # Parse poses JSON back to list
        poses_data = json.loads(result["poses"]) if result["poses"] else []
        poses = [PoseData(**pose) for pose in poses_data]
        
        return SequenceResponse(
            id=result["id"],
            name=result["name"],
            description=result["description"],
            duration=result["duration"],
            poseCount=result["pose_count"],
            poses=poses,
            createdAt=result["created_at"].isoformat() if result["created_at"] else None,
            category=result["category"] if "category" in result else None,
            privacy=result["privacy"] if "privacy" in result else "private",
            industryLabel=result["industry_label"] if "industry_label" in result else "Yoga"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update sequence: {str(e)}")

@router.delete("/{sequence_id}")
async def delete_sequence(sequence_id: str):
    """Delete a sequence by ID"""
    try:
        # First check if sequence exists
        check_query = "SELECT id FROM sequences WHERE id = :id"
        existing = await database.fetch_one(check_query, {"id": sequence_id})
        
        if not existing:
            raise HTTPException(status_code=404, detail="Sequence not found")
        
        # Delete the sequence
        delete_query = "DELETE FROM sequences WHERE id = :id"
        await database.execute(delete_query, {"id": sequence_id})
        
        return {"message": "Sequence deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete sequence: {str(e)}")

@router.post("/track-download")
async def track_download(
    sequence_id: str,
    download_source: str = "browse",
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
):
    """Track a sequence download"""
    try:
        # Get user ID if authenticated
        user_id = None
        if credentials:
            try:
                user_id = get_current_user_id(credentials.credentials)
            except:
                # If token is invalid, just continue without user_id
                user_id = None
        
        # Insert download record
        query = """
        INSERT INTO downloads (sequence_id, downloaded_by_user_id, download_source)
        VALUES (:sequence_id, :downloaded_by_user_id, :download_source)
        """
        
        await database.execute(
            query,
            {
                "sequence_id": sequence_id,
                "downloaded_by_user_id": user_id,
                "download_source": download_source
            }
        )
        
        return {"message": "Download tracked successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to track download: {str(e)}")

@router.get("/download-stats/{user_id}")
async def get_download_stats(user_id: str):
    """Get download statistics for a user's public sequences from browse page"""
    try:
        # Count downloads of user's public sequences from browse page only
        # Excludes downloads by the user themselves
        query = """
        SELECT COUNT(*) as download_count
        FROM downloads d
        JOIN sequences s ON d.sequence_id = s.id
        WHERE s.user_id = :user_id 
        AND s.privacy = 'public'
        AND d.download_source = 'browse'
        AND (d.downloaded_by_user_id IS NULL OR d.downloaded_by_user_id != :user_id)
        """
        
        result = await database.fetch_one(query, {"user_id": user_id})
        return {"total_downloads": result["download_count"] if result else 0}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get download stats: {str(e)}")
@router.get("/user/{user_id}/public", response_model=List[SequenceResponse])
async def get_user_public_sequences(user_id: str):
    """Get all public sequences by a specific user"""
    try:
        query = """
        SELECT s.*, u.id as user_id, u.first_name, u.last_name, u.profile_image, u.business_name
        FROM sequences s
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id = :user_id AND s.privacy = 'public'
        ORDER BY s.created_at DESC
        """
        result = await database.fetch_all(query, {"user_id": user_id})
        
        sequences = []
        for row in result:
            # Parse poses JSON back to list
            poses_data = json.loads(row["poses"]) if row["poses"] else []
            poses = [PoseData(**pose) for pose in poses_data]
            
            # Create user info
            user_info = UserInfo(
                id=row["user_id"],
                first_name=row["first_name"],
                last_name=row["last_name"],
                profile_image=row["profile_image"],
                business_name=row["business_name"]
            )
            
            sequences.append(SequenceResponse(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                duration=row["duration"],
                poseCount=row["pose_count"],
                poses=poses,
                createdAt=row["created_at"].isoformat() if row["created_at"] else None,
                category=row["category"] if "category" in row else None,
                privacy=row["privacy"] if "privacy" in row else "public",
                industryLabel=row["industry_label"] if "industry_label" in row else "Yoga",
                user=user_info
            ))
        
        return sequences
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user sequences: {str(e)}")
