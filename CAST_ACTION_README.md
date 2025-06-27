# FarMap Cast Action - Legendary Photo Upload Feature

This feature enables users to directly open the FarMap mini app from the Farcaster cast composer and have casts automatically composed for them after uploading photos to the interactive map.

## How It Works

### 1. Cast Action Installation

Users can install the FarMap cast action by clicking this deep link:

```
https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Ffarmap.vercel.app%2Fapi%2Fcast-action
```

### 2. Using the Cast Action

1. When composing a cast in Warpcast, users will see the "Upload to FarMap" button in their action bar
2. Clicking the button opens the FarMap mini app in a frame
3. Users can upload a photo and select a location on the map
4. After uploading, a cast is automatically composed with the photo link

### 3. Technical Implementation

#### Cast Action API Endpoints

- **GET** `/api/cast-action` - Returns metadata about the action
- **POST** `/api/cast-action` - Handles action requests and opens the mini app

#### Upload Flow

1. Cast action generates a unique session ID
2. Opens `/upload?session={sessionId}&cast_id={castHash}` in a frame
3. User uploads photo and selects location
4. Photo is saved to the map
5. Cast is automatically composed using the Farcaster SDK

## API Response Format

### Metadata Response (GET)

```json
{
  "name": "Upload to FarMap",
  "icon": "image",
  "description": "Upload a photo to the interactive map and share it in your feed",
  "aboutUrl": "https://farmap.vercel.app",
  "action": {
    "type": "post",
    "postUrl": "https://farmap.vercel.app/api/cast-action"
  }
}
```

### Action Response (POST)

```json
{
  "type": "frame",
  "frameUrl": "https://farmap.vercel.app/upload?session={sessionId}&cast_id={castHash}"
}
```

## Features

- **Seamless Integration**: Works directly from the cast composer
- **Automatic Cast Composition**: Casts are automatically composed after upload
- **Interactive Map**: Users can select exact locations for their photos
- **Social Sharing**: Photos are shared with proper metadata and links
- **Session Management**: Unique sessions prevent conflicts between users

## Development

### Local Testing

1. Start the development server: `pnpm dev`
2. Test the cast action endpoints:
   - `GET http://localhost:5173/api/cast-action`
   - `POST http://localhost:5173/api/cast-action`
3. Use the Warpcast dev tools to test the mini app integration

### Production Deployment

The cast action is automatically deployed with the main FarMap application at `https://farmap.vercel.app`.

## Future Enhancements

- **Batch Uploads**: Support for multiple photos in one session
- **Location Suggestions**: AI-powered location suggestions based on photo content
- **Social Features**: Comments and reactions on map photos
- **Advanced Composer**: Rich text editing and hashtag suggestions

## Troubleshooting

### Common Issues

1. **Cast Action Not Appearing**: Ensure the user has installed the action via the deep link
2. **Upload Fails**: Check that the user is signed in with Farcaster
3. **Cast Not Composed**: Verify the Farcaster SDK context is available

### Debug Mode

Enable debug logging by checking the browser console for detailed error messages during the upload process.
